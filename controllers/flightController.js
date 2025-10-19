const { supabase } = require('../config/db');

// Get all flights
const getAllFlights = async (req, res) => {
    try {
        const { data: flights, error } = await supabase
            .from('flights_flight')
            .select('*')
            .eq('is_active', true)
            .gt('available_seats', 0)
            .order('departure_datetime', { ascending: true });

        if (error) {
            console.error('Get flights error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch flights',
                error: error.message
            });
        }

        res.json({
            success: true,
            data: { flights }
        });
    } catch (error) {
        console.error('Get all flights error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get flight by ID
const getFlightById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: flight, error } = await supabase
            .from('flights_flight')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        res.json({
            success: true,
            data: flight
        });
    } catch (error) {
        console.error('Get flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getAllFlights,
    getFlightById
};
