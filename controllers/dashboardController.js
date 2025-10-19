const { supabase } = require('../config/db');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get package bookings count and sum
        const { data: packageBookings, error: pkgError } = await supabase
            .from('user_booked_packages')
            .select('price, status')
            .eq('user_id', userId);

        if (pkgError) {
            console.error('Package bookings error:', pkgError);
        }

        // Get hotel bookings count and sum
        const { data: hotelBookings, error: hotelError } = await supabase
            .from('user_booked_hotels')
            .select('total_price, status')
            .eq('user_id', userId);

        if (hotelError) {
            console.error('Hotel bookings error:', hotelError);
        }

        // Get flight bookings count and sum
        const { data: flightBookings, error: flightError } = await supabase
            .from('user_booked_flights')
            .select('total_price, status')
            .eq('user_id', userId);

        if (flightError) {
            console.error('Flight bookings error:', flightError);
        }

        // Calculate statistics
        const allPackages = packageBookings || [];
        const allHotels = hotelBookings || [];
        const allFlights = flightBookings || [];

        const packageBookingsCount = allPackages.length;
        const hotelBookingsCount = allHotels.length;
        const flightBookingsCount = allFlights.length;
        const totalBookings = packageBookingsCount + hotelBookingsCount + flightBookingsCount;

        // Count confirmed/cancelled
        const confirmedPackages = allPackages.filter(b => b.status === 'confirmed').length;
        const confirmedHotels = allHotels.filter(b => b.status === 'confirmed').length;
        const confirmedFlights = allFlights.filter(b => b.status === 'confirmed').length;

        const cancelledPackages = allPackages.filter(b => b.status === 'cancelled').length;
        const cancelledHotels = allHotels.filter(b => b.status === 'cancelled').length;
        const cancelledFlights = allFlights.filter(b => b.status === 'cancelled').length;

        const upcomingTrips = confirmedPackages + confirmedHotels + confirmedFlights;
        const cancelledBookings = cancelledPackages + cancelledHotels + cancelledFlights;

        // Calculate total spent (excluding cancelled)
        const packageSpent = allPackages
            .filter(b => b.status !== 'cancelled')
            .reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);

        const hotelSpent = allHotels
            .filter(b => b.status !== 'cancelled')
            .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);

        const flightSpent = allFlights
            .filter(b => b.status !== 'cancelled')
            .reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);

        const totalSpent = packageSpent + hotelSpent + flightSpent;
        const averageSpentPerTrip = upcomingTrips > 0 ? (totalSpent / upcomingTrips) : 0;

        res.json({
            success: true,
            data: {
                totalBookings,
                packageBookings: packageBookingsCount,
                hotelBookings: hotelBookingsCount,
                flightBookings: flightBookingsCount,
                upcomingTrips,
                completedTrips: 0, // Can be calculated based on dates
                cancelledBookings,
                totalSpent: Math.round(totalSpent * 100) / 100,
                averageSpentPerTrip: Math.round(averageSpentPerTrip * 100) / 100
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats
};
