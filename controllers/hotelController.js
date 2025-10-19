const { supabase } = require('../config/db');

// Get all hotels
const getAllHotels = async (req, res) => {
    try {
        const { data: hotels, error } = await supabase
            .from('hotels_hotel')
            .select('*')
            .eq('test_data', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get hotels error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch hotels',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: { hotels }
        });
    } catch (error) {
        console.error('Get all hotels error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get hotel by ID
const getHotelById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: hotel, error } = await supabase
            .from('hotels_hotel')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        res.json({
            success: true,
            data: hotel
        });
    } catch (error) {
        console.error('Get hotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getAllHotels,
    getHotelById
};
