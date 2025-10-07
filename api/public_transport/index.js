const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const supabase = require('../../utils/supabaseClient');

const localTransportFile = path.resolve(__dirname, '../../data/public_transport_options.json');

let cachedLocalTransport = null;

const loadLocalTransportOptions = () => {
    if (cachedLocalTransport) {
        return cachedLocalTransport;
    }

    try {
        const raw = fs.readFileSync(localTransportFile, 'utf-8');
        cachedLocalTransport = JSON.parse(raw);
    } catch (error) {
        cachedLocalTransport = [];
        console.warn(`[Transport] Unable to load local fallback data: ${error.message}`);
    }

    return cachedLocalTransport;
};

const shouldUseLocalFallback = (error) => {
    if (!supabase.isConfigured) {
        return true;
    }

    if (!error) {
        return false;
    }

    return error.code === '42P01' || (error.message && error.message.toLowerCase().includes('relation "public.transport_options"'));
};

const filterTransport = (entries, from, to, transportType) => {
    let filtered = [...entries];

    if (from) {
        const normalizedFrom = from.trim().toLowerCase();
        filtered = filtered.filter((entry) => (entry.from_location || '').toLowerCase() === normalizedFrom);
    }

    if (to) {
        const normalizedTo = to.trim().toLowerCase();
        filtered = filtered.filter((entry) => (entry.to_location || '').toLowerCase() === normalizedTo);
    }

    if (transportType) {
        const normalizedType = transportType.trim().toLowerCase();
        filtered = filtered.filter((entry) => (entry.type || '').toLowerCase() === normalizedType);
    }

    return filtered;
};

// Get all transport options
router.get('/options', async (req, res) => {
    if (!supabase.isConfigured) {
        return res.json(loadLocalTransportOptions());
    }

    const { data, error } = await supabase.from('transport_options').select('*');

    if (error) {
        if (shouldUseLocalFallback(error)) {
            return res.json(loadLocalTransportOptions());
        }

        return res.status(500).json({ message: error.message });
    }

    res.json(data);
});

// Search transport options
router.post('/search', async (req, res) => {
    const { from, to, transport_type } = req.body;

    if (!supabase.isConfigured) {
        const localResults = filterTransport(loadLocalTransportOptions(), from, to, transport_type);
        return res.json(localResults);
    }

    let query = supabase.from('transport_options').select('*');

    if (from) {
        query = query.eq('from_location', from);
    }

    if (to) {
        query = query.eq('to_location', to);
    }

    if (transport_type) {
        query = query.eq('type', transport_type);
    }

    const { data, error } = await query;

    if (error) {
        if (shouldUseLocalFallback(error)) {
            const localResults = filterTransport(loadLocalTransportOptions(), from, to, transport_type);
            return res.json(localResults);
        }

        return res.status(500).json({ message: error.message });
    }

    res.json(data);
});

// Get transport details
router.get('/options/:transport_id', (req, res) => {
    const { transport_id: rawTransportId } = req.params;

    if (!rawTransportId) {
        return res.status(400).json({ message: 'Transport ID is required' });
    }

    if (!supabase.isConfigured) {
        const fallbackMatch = loadLocalTransportOptions().find((option) => String(option.id) === String(rawTransportId));
        if (!fallbackMatch) {
            return res.status(404).json({ message: 'Transport option not found' });
        }
        return res.json(fallbackMatch);
    }

    res.json({ message: `Retrieve details for transport ID: ${req.params.transport_id}` });
});

module.exports = router;