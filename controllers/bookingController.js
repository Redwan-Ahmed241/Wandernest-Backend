const { supabase } = require('../config/db');

// Book a package
const bookPackage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { package_id, start_date, end_date, travelers } = req.body;

        // Validate required fields
        if (!package_id || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Package ID, start date, and end date are required'
            });
        }

        // Get package details from packages_package table
        const { data: pkg, error: pkgError } = await supabase
            .from('packages_package')
            .select('*')
            .eq('id', package_id)
            .single();

        if (pkgError || !pkg) {
            return res.status(404).json({
                success: false,
                message: 'Package not found'
            });
        }

        // Create booking with snapshot of package data
        const { data: booking, error: bookingError } = await supabase
            .from('user_booked_packages')
            .insert([{
                user_id: userId,
                package_id: pkg.id,
                title: pkg.title,
                description: pkg.description,
                from_location: pkg.from_location,
                to_location: pkg.to_location,
                duration: pkg.days ? `${pkg.days} days` : pkg.duration,
                price: pkg.price,
                image_url: pkg.image_url,
                transport_id: pkg.transport_id,
                transport_name: pkg.transport_name,
                hotel_id: pkg.hotel_id,
                hotel_name: pkg.hotel_name,
                guide_id: pkg.guide_id,
                guide_name: pkg.guide_name,
                package_type: pkg.package_type,
                subtitle: pkg.subtitle,
                start_date,
                end_date,
                travelers: travelers || 1,
                status: 'confirmed'
            }])
            .select()
            .single();

        if (bookingError) {
            console.error('Booking error:', bookingError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create booking',
                error: bookingError.message
            });
        }

        res.status(201).json({
            success: true,
            data: {
                booking_id: booking.id,
                message: 'Package booked successfully',
                booking
            }
        });
    } catch (error) {
        console.error('Book package error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Book a hotel
const bookHotel = async (req, res) => {
    try {
        const userId = req.user.id;
        const { hotel_id, check_in_date, check_out_date, rooms, guests } = req.body;

        // Validate required fields
        if (!hotel_id || !check_in_date || !check_out_date) {
            return res.status(400).json({
                success: false,
                message: 'Hotel ID, check-in date, and check-out date are required'
            });
        }

        // Get hotel details from hotels_hotel table
        const { data: hotel, error: hotelError } = await supabase
            .from('hotels_hotel')
            .select('*')
            .eq('id', hotel_id)
            .single();

        if (hotelError || !hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        // Calculate total price
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const totalPrice = hotel.price * nights * (rooms || 1);

        // Create booking with snapshot of hotel data
        const { data: booking, error: bookingError } = await supabase
            .from('user_booked_hotels')
            .insert([{
                user_id: userId,
                hotel_id: hotel.id,
                name: hotel.name,
                location: hotel.location,
                description: hotel.description,
                room_type: hotel.room_type,
                price_per_night: hotel.price,
                image_url: hotel.image_url,
                amenities: hotel.amenities,
                star: hotel.star,
                hotel_type: hotel.type,
                check_in_date,
                check_out_date,
                rooms: rooms || 1,
                guests: guests || 1,
                total_price: totalPrice,
                status: 'confirmed'
            }])
            .select()
            .single();

        if (bookingError) {
            console.error('Booking error:', bookingError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create booking',
                error: bookingError.message
            });
        }

        res.status(201).json({
            success: true,
            data: {
                booking_id: booking.id,
                message: 'Hotel booked successfully',
                booking
            }
        });
    } catch (error) {
        console.error('Book hotel error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Book a flight
const bookFlight = async (req, res) => {
    try {
        const userId = req.user.id;
        const { flight_id, departure_time, arrival_time, passengers } = req.body;

        // Validate required fields
        if (!flight_id || !departure_time || !arrival_time) {
            return res.status(400).json({
                success: false,
                message: 'Flight ID, departure time, and arrival time are required'
            });
        }

        // Get flight details from flights_flight table
        const { data: flight, error: flightError } = await supabase
            .from('flights_flight')
            .select('*')
            .eq('id', flight_id)
            .single();

        if (flightError || !flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found'
            });
        }

        // Calculate total price
        const totalPrice = flight.current_price * (passengers || 1);

        // Create booking with snapshot of flight data
        const { data: booking, error: bookingError } = await supabase
            .from('user_booked_flights')
            .insert([{
                user_id: userId,
                flight_id: flight.id,
                flight_number: flight.flight_number,
                airline: flight.airline_id,
                departure_airport: flight.from_airport_id,
                arrival_airport: flight.to_airport_id,
                departure_city: flight.departure_city,
                arrival_city: flight.arrival_city,
                price: flight.current_price,
                booking_class: flight.booking_class,
                duration: flight.duration,
                baggage_allowance: flight.baggage_allowance,
                meal_included: flight.meal_included,
                wifi_available: flight.wifi_available,
                departure_time,
                arrival_time,
                passengers: passengers || 1,
                total_price: totalPrice,
                status: 'confirmed'
            }])
            .select()
            .single();

        if (bookingError) {
            console.error('Booking error:', bookingError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create booking',
                error: bookingError.message
            });
        }

        res.status(201).json({
            success: true,
            data: {
                booking_id: booking.id,
                message: 'Flight booked successfully',
                booking
            }
        });
    } catch (error) {
        console.error('Book flight error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get user's bookings by type
const getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type } = req.query;

        let tableName;
        switch (type) {
            case 'package':
                tableName = 'user_booked_packages';
                break;
            case 'hotel':
                tableName = 'user_booked_hotels';
                break;
            case 'flight':
                tableName = 'user_booked_flights';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid type. Must be package, hotel, or flight'
                });
        }

        const { data: bookings, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Get bookings error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch bookings',
                error: error.message
            });
        }

        // Add type to each booking
        const bookingsWithType = bookings.map(booking => ({
            ...booking,
            type
        }));

        res.json({
            success: true,
            data: {
                bookings: bookingsWithType,
                count: bookings.length
            }
        });
    } catch (error) {
        console.error('Get my bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get specific booking details
const getBookingById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { type } = req.query;

        let tableName;
        switch (type) {
            case 'package':
                tableName = 'user_booked_packages';
                break;
            case 'hotel':
                tableName = 'user_booked_hotels';
                break;
            case 'flight':
                tableName = 'user_booked_flights';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid type. Must be package, hotel, or flight'
                });
        }

        const { data: booking, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: {
                ...booking,
                is_booked: true
            }
        });
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Cancel booking (soft delete - update status)
const cancelBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { type } = req.query;

        let tableName;
        switch (type) {
            case 'package':
                tableName = 'user_booked_packages';
                break;
            case 'hotel':
                tableName = 'user_booked_hotels';
                break;
            case 'flight':
                tableName = 'user_booked_flights';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid type. Must be package, hotel, or flight'
                });
        }

        const { data: booking, error } = await supabase
            .from(tableName)
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error || !booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or already cancelled'
            });
        }

        res.json({
            success: true,
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} booking cancelled successfully`,
            data: {
                id: booking.id,
                status: booking.status
            }
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    bookPackage,
    bookHotel,
    bookFlight,
    getMyBookings,
    getBookingById,
    cancelBooking
};
