const express = require('express');
const router = express.Router();
const supabase = require('../../utils/supabaseClient');

// Get all transport options
router.get('/options', async (req, res) => {
    const { data, error } = await supabase.from('transport_options').select('*');
    if (error) {
        return res.status(500).json({ message: error.message });
    }
    res.json(data);
});

// Search transport options
router.post('/search', async (req, res) => {
    const { from, to, transport_type } = req.body;
    const { data, error } = await supabase
        .from('transport_options')
        .select('*')
        .eq('from_location', from)
        .eq('to_location', to)
        .eq('type', transport_type);

    if (error) {
        return res.status(500).json({ message: error.message });
    }
    res.json(data);
});

// Get transport details
router.get('/options/:transport_id', (req, res) => {
    res.json({ message: `Retrieve details for transport ID: ${req.params.transport_id}` });
});

module.exports = router;