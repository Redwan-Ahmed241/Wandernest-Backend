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
router.get('/:guide_id', (req, res) => {
    res.json({ message: `Retrieve details for guide ID: ${req.params.guide_id}` });
});

module.exports = router;