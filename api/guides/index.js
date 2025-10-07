const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabaseClient');

// Get all guides
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('guides').select('*');
    if (error) {
        return res.status(500).json({ message: error.message });
    }
    res.json(data);
});

// Search guides
router.post('/search', async (req, res) => {
    const { location, specialties } = req.body;
    const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('area', location)
        .contains('specialties', specialties);

    if (error) {
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

    const guideId = isNaN(Number(rawGuideId)) ? rawGuideId : Number(rawGuideId);

    const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('id', guideId)
        .limit(1);

    if (error) {
        return res.status(500).json({ message: error.message });
    }

    if (!data || data.length === 0) {
        return res.status(404).json({ message: 'Guide not found' });
    }

    res.json(data[0]);
});

module.exports = router;