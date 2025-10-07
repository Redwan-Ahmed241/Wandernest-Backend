const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const supabase = require('../../utils/supabaseClient');

const localGuidesFile = path.resolve(__dirname, '../../data/guides.json');

let cachedLocalGuides = null;

const loadLocalGuides = () => {
    if (cachedLocalGuides) {
        return cachedLocalGuides;
    }

    try {
        const raw = fs.readFileSync(localGuidesFile, 'utf-8');
        cachedLocalGuides = JSON.parse(raw);
    } catch (error) {
        cachedLocalGuides = [];
        console.warn(`[Guides] Unable to load local fallback data: ${error.message}`);
    }

    return cachedLocalGuides;
};

const shouldUseLocalFallback = (error) => {
    if (!supabase.isConfigured) {
        return true;
    }

    if (!error) {
        return false;
    }

    return error.code === '42P01' || (error.message && error.message.toLowerCase().includes('relation "public.guides"'));
};

const parseGuideId = (rawGuideId) => {
    if (rawGuideId === undefined || rawGuideId === null) {
        return rawGuideId;
    }

    const numeric = Number(rawGuideId);
    return Number.isNaN(numeric) ? rawGuideId : numeric;
};

const matchesGuideId = (guide, id) => String(guide.id) === String(id);

const filterGuides = (guides, location, specialties) => {
    let filtered = [...guides];

    if (location) {
        const normalizedLocation = location.trim().toLowerCase();
        filtered = filtered.filter((guide) => (guide.area || '').toLowerCase() === normalizedLocation);
    }

    if (Array.isArray(specialties) && specialties.length > 0) {
        const normalizedSpecialties = specialties.map((specialty) => String(specialty).toLowerCase());
        filtered = filtered.filter((guide) => {
            const guideSpecialties = Array.isArray(guide.specialties) ? guide.specialties.map((specialty) => String(specialty).toLowerCase()) : [];
            return normalizedSpecialties.every((specialty) => guideSpecialties.includes(specialty));
        });
    }

    return filtered;
};

// Get all guides
router.get('/', async (req, res) => {
    if (!supabase.isConfigured) {
        return res.json(loadLocalGuides());
    }

    const { data, error } = await supabase.from('guides').select('*');

    if (error) {
        if (shouldUseLocalFallback(error)) {
            return res.json(loadLocalGuides());
        }

        return res.status(500).json({ message: error.message });
    }

    res.json(data);
});

// Search guides
router.post('/search', async (req, res) => {
    const { location, specialties } = req.body;

    if (!supabase.isConfigured) {
        const localResults = filterGuides(loadLocalGuides(), location, specialties);
        return res.json(localResults);
    }

    let query = supabase.from('guides').select('*');

    if (location) {
        query = query.eq('area', location);
    }

    if (Array.isArray(specialties) && specialties.length > 0) {
        query = query.contains('specialties', specialties);
    }

    const { data, error } = await query;

    if (error) {
        if (shouldUseLocalFallback(error)) {
            const localResults = filterGuides(loadLocalGuides(), location, specialties);
            return res.json(localResults);
        }

        return res.status(500).json({ message: error.message });
    }

    res.json(data);
});

// Get guide details
router.get('/:guide_id', async (req, res) => {
    const { guide_id: rawGuideId } = req.params;

    if (!rawGuideId) {
        return res.status(400).json({ message: 'Guide ID is required' });
    }

    const guideId = parseGuideId(rawGuideId);

    if (!supabase.isConfigured) {
        const fallbackGuide = loadLocalGuides().find((guide) => matchesGuideId(guide, guideId));
        if (!fallbackGuide) {
            return res.status(404).json({ message: 'Guide not found' });
        }
        return res.json(fallbackGuide);
    }

    const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('id', guideId)
        .limit(1);

    if (error) {
        if (shouldUseLocalFallback(error)) {
            const fallbackGuide = loadLocalGuides().find((guide) => matchesGuideId(guide, guideId));
            if (!fallbackGuide) {
                return res.status(404).json({ message: 'Guide not found' });
            }
            return res.json(fallbackGuide);
        }

        return res.status(500).json({ message: error.message });
    }

    if (!data || data.length === 0) {
        return res.status(404).json({ message: 'Guide not found' });
    }

    res.json(data[0]);
});

module.exports = router;