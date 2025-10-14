const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const transportRouter = express.Router();
const transportPackagesRouter = express.Router();

const supabase = require('../../utils/supabaseClient');
const { normalizeTransportOption } = require('../../models/TransportOption');

const localTransportFile = path.resolve(__dirname, '../../data/public_transport_options.json');

let cachedLocalTransport = null;

const inMemoryTransportState = {
    bookings: [],
    liveStatus: new Map(),
    routeUpdates: [],
};

const DEFAULT_PAGE_SIZE = 20;
const BOOKING_PREFIX = 'TRB-';
const BOOKING_REFERENCE_PREFIX = 'TR';

const randomId = (prefix = '') => {
    if (typeof crypto.randomUUID === 'function') {
        return `${prefix}${crypto.randomUUID()}`;
    }

    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
};

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

const toArray = (value) => {
    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch (error) {
            // Ignore JSON parse error
        }

        return value
            .split(',')
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);
    }

    return [];
};

const parseNumber = (value, fallback = null) => {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const parseTransportId = (rawTransportId) => {
    if (rawTransportId === undefined || rawTransportId === null) {
        return rawTransportId;
    }

    const numeric = Number(rawTransportId);
    return Number.isNaN(numeric) ? rawTransportId : numeric;
};

const paginate = (items, page, limit) => {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * limit;
    const end = start + limit;

    return {
        items: items.slice(start, end),
        total,
        page: safePage,
        totalPages,
    };
};

const buildFiltersApplied = (params) => {
    const filters = {};

    if (params.from) filters.from = params.from;
    if (params.to) filters.to = params.to;
    if (params.transport_type) filters.transport_type = params.transport_type;
    if (params.max_price !== null) filters.max_price = params.max_price;
    if (params.features.length) filters.features = params.features;
    if (params.date) filters.date = params.date;

    return filters;
};

const applyTransportFilters = (options, params) => options.filter((option) => {
    if (params.from) {
        if (String(option.from_location || '').toLowerCase() !== params.from.toLowerCase()) {
            return false;
        }
    }

    if (params.to) {
        if (String(option.to_location || '').toLowerCase() !== params.to.toLowerCase()) {
            return false;
        }
    }

    if (params.transport_type) {
        if (String(option.type || '').toLowerCase() !== params.transport_type.toLowerCase()) {
            return false;
        }
    }

    if (params.max_price !== null && typeof option.price === 'number') {
        if (option.price > params.max_price) {
            return false;
        }
    }

    if (params.features.length > 0) {
        const optionFeatures = Array.isArray(option.features)
            ? option.features.map((feature) => feature.toLowerCase())
            : [];
        const requestedFeatures = params.features.map((feature) => feature.toLowerCase());

        const hasFeatures = requestedFeatures.every((feature) => optionFeatures.includes(feature));
        if (!hasFeatures) {
            return false;
        }
    }

    return true;
});

const sortTransportOptions = (options, sortBy, sortOrder) => {
    if (!sortBy) {
        return options;
    }

    const direction = sortOrder === 'desc' ? -1 : 1;
    const sorted = [...options];

    sorted.sort((a, b) => {
        const getValue = (option, field) => {
            switch (field) {
                case 'price':
                    return typeof option.price === 'number' ? option.price : Number.POSITIVE_INFINITY;
                case 'duration':
                    return parseNumber(option.schedule?.duration, Number.POSITIVE_INFINITY);
                case 'rating':
                    return typeof option.rating === 'number' ? option.rating : -Number.POSITIVE_INFINITY;
                default:
                    return 0;
            }
        };

        const valueA = getValue(a, sortBy);
        const valueB = getValue(b, sortBy);

        if (valueA < valueB) return -1 * direction;
        if (valueA > valueB) return 1 * direction;
        return 0;
    });

    return sorted;
};

const fetchTransportDataset = async () => {
    // Always try local data first for development
    const localData = loadLocalTransportOptions();
    if (localData && localData.length > 0) {
        return { items: localData, source: 'local' };
    }

    if (!supabase.isConfigured) {
        return { items: localData, source: 'local' };
    }

    const { data, error } = await supabase
        .from('transport_options')
        .select('*, from_destination:destinations!from_destination_id(*), to_destination:destinations!to_destination_id(*)');

    if (error) {
        if (shouldUseLocalFallback(error)) {
            return { items: localData, source: 'local', warning: error.message };
        }

        return { items: [], error };
    }

    return { items: Array.isArray(data) ? data : [], source: 'supabase' };
};

const getNormalizedTransportOptions = async () => {
    const dataset = await fetchTransportDataset();

    if (dataset.error) {
        throw dataset.error;
    }

    return {
        transports: dataset.items.map((item) => normalizeTransportOption(item)),
        source: dataset.source,
        warning: dataset.warning || null,
    };
};

const findTransportById = async (rawTransportId) => {
    const transportId = parseTransportId(rawTransportId);
    const { transports } = await getNormalizedTransportOptions();

    return transports.find((option) => String(option.id) === String(transportId)) || null;
};

const ensureLiveStatusSeed = async (transportId) => {
    if (inMemoryTransportState.liveStatus.has(transportId)) {
        return inMemoryTransportState.liveStatus.get(transportId);
    }

    const option = await findTransportById(transportId);

    const now = new Date();
    const liveStatus = {
        transport_id: String(transportId),
        name: option?.name || 'Transport Option',
        current_status: 'on_time',
        next_departure: '14:30',
        delay_minutes: 0,
        available_seats: 20,
        last_updated: now.toISOString(),
    };

    inMemoryTransportState.liveStatus.set(transportId, liveStatus);
    return liveStatus;
};

const ensureRouteUpdatesSeed = () => {
    if (inMemoryTransportState.routeUpdates.length > 0) {
        return inMemoryTransportState.routeUpdates;
    }

    inMemoryTransportState.routeUpdates.push({
        id: randomId('update_'),
        route: 'Dhaka to Chittagong',
        transport_type: 'bus',
        status: 'on_schedule',
        message: 'No delays reported.',
        updated_at: new Date().toISOString(),
    });

    return inMemoryTransportState.routeUpdates;
};

transportRouter.get('/options', async (req, res) => {
    const params = {
        from: req.query.from || null,
        to: req.query.to || null,
        transport_type: req.query.transport_type || null,
        max_price: parseNumber(req.query.max_price, null),
        features: toArray(req.query.features),
        sort_by: req.query.sort_by || null,
        sort_order: req.query.sort_order || 'asc',
        page: parseNumber(req.query.page, 1),
        limit: parseNumber(req.query.limit, DEFAULT_PAGE_SIZE),
        date: req.query.date || null,
    };

    try {
        const { transports, source } = await getNormalizedTransportOptions();

        const filtered = applyTransportFilters(transports, params);
        const sorted = sortTransportOptions(filtered, params.sort_by, params.sort_order);
        const pagination = paginate(sorted, params.page, params.limit || DEFAULT_PAGE_SIZE);

        return res.json({
            success: true,
            data: {
                transports: pagination.items,
                total_results: pagination.total,
                page: pagination.page,
                total_pages: pagination.totalPages,
                filters_applied: buildFiltersApplied(params),
            },
            message: 'Transport options retrieved successfully',
            meta: { source },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

transportRouter.post('/search', async (req, res) => {
    const params = {
        from: req.body.from || null,
        to: req.body.to || null,
        transport_type: req.body.transport_type || null,
        max_price: parseNumber(req.body.max_price, null),
        features: toArray(req.body.features),
        sort_by: req.body.sort_by || null,
        sort_order: req.body.sort_order || 'asc',
        page: parseNumber(req.body.page, 1),
        limit: parseNumber(req.body.limit, DEFAULT_PAGE_SIZE),
        date: req.body.date || null,
    };

    try {
        const { transports, source } = await getNormalizedTransportOptions();

        const filtered = applyTransportFilters(transports, params);
        const sorted = sortTransportOptions(filtered, params.sort_by, params.sort_order);
        const pagination = paginate(sorted, params.page, params.limit || DEFAULT_PAGE_SIZE);

        return res.json({
            success: true,
            data: {
                transports: pagination.items,
                total_results: pagination.total,
                page: pagination.page,
                total_pages: pagination.totalPages,
                filters_applied: buildFiltersApplied(params),
            },
            message: 'Search completed successfully',
            meta: { source },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

transportRouter.post('/bookings', async (req, res) => {
    const payload = req.body || {};

    if (!payload.transport_id) {
        return res.status(400).json({ success: false, message: 'transport_id is required' });
    }

    if (!payload.travel_date) {
        return res.status(400).json({ success: false, message: 'travel_date is required' });
    }

    if (!payload.contact_email) {
        return res.status(400).json({ success: false, message: 'contact_email is required' });
    }

    try {
        const option = await findTransportById(payload.transport_id);

        if (!option) {
            return res.status(404).json({ success: false, message: 'Transport option not found' });
        }

        const bookingId = `${BOOKING_PREFIX}${String(inMemoryTransportState.bookings.length + 1).padStart(3, '0')}`;
        const bookingReference = `${BOOKING_REFERENCE_PREFIX}-${payload.travel_date.replace(/-/g, '')}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;

        const booking = {
            booking_id: bookingId,
            booking_reference: bookingReference,
            status: payload.status || 'pending',
            transport_details: {
                id: option.id,
                name: option.name,
                route: option.route,
                departure_time: option.schedule?.departure_times?.[0] || null,
                travel_date: payload.travel_date,
            },
            passengers: Array.isArray(payload.passengers) ? payload.passengers : [],
            total_amount: payload.total_price || option.price || 0,
            payment_status: payload.payment_status || 'pending',
            created_at: new Date().toISOString(),
        };

        inMemoryTransportState.bookings.push(booking);

        return res.status(201).json({
            success: true,
            data: booking,
            message: 'Booking created successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

transportRouter.get('/bookings/my-bookings', (req, res) => {
    const { status, date_from: dateFrom, date_to: dateTo } = req.query;

    let bookings = [...inMemoryTransportState.bookings];

    if (status) {
        bookings = bookings.filter((booking) => booking.status === status);
    }

    if (dateFrom) {
        bookings = bookings.filter((booking) => booking.transport_details?.travel_date >= dateFrom);
    }

    if (dateTo) {
        bookings = bookings.filter((booking) => booking.transport_details?.travel_date <= dateTo);
    }

    return res.json({
        success: true,
        data: {
            bookings,
            total_bookings: bookings.length,
        },
        message: 'Bookings retrieved successfully',
    });
});

transportRouter.get('/bookings/:booking_id', (req, res) => {
    const booking = inMemoryTransportState.bookings.find((entry) => entry.booking_id === req.params.booking_id);

    if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.json({ success: true, data: booking, message: 'Booking details retrieved successfully' });
});

transportRouter.patch('/bookings/:booking_id', (req, res) => {
    const booking = inMemoryTransportState.bookings.find((entry) => entry.booking_id === req.params.booking_id);

    if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    Object.assign(booking, req.body || {});
    booking.updated_at = new Date().toISOString();

    return res.json({ success: true, data: booking, message: 'Booking updated successfully' });
});

transportRouter.delete('/bookings/:booking_id', (req, res) => {
    const previousLength = inMemoryTransportState.bookings.length;
    inMemoryTransportState.bookings = inMemoryTransportState.bookings.filter((entry) => entry.booking_id !== req.params.booking_id);

    if (inMemoryTransportState.bookings.length === previousLength) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.json({ success: true, message: 'Booking cancelled successfully' });
});

transportRouter.get('/options/:transport_id', async (req, res) => {
    const { transport_id: rawTransportId } = req.params;

    if (!rawTransportId) {
        return res.status(400).json({ success: false, message: 'Transport ID is required' });
    }

    try {
        const option = await findTransportById(rawTransportId);

        if (!option) {
            return res.status(404).json({ success: false, message: 'Transport option not found' });
        }

        return res.json({
            success: true,
            data: option,
            message: 'Transport details retrieved successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

transportRouter.get('/live-status/:transport_id', async (req, res) => {
    try {
        const liveStatus = await ensureLiveStatusSeed(req.params.transport_id);
        return res.json({ success: true, data: liveStatus, message: 'Live status retrieved successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

transportRouter.get('/route-updates', (req, res) => {
    const updates = ensureRouteUpdatesSeed();
    const { route, transport_type: transportType } = req.query;

    let filtered = [...updates];

    if (route) {
        filtered = filtered.filter((update) => update.route.toLowerCase() === route.toLowerCase());
    }

    if (transportType) {
        filtered = filtered.filter((update) => update.transport_type.toLowerCase() === transportType.toLowerCase());
    }

    return res.json({ success: true, data: filtered, message: 'Route updates retrieved successfully' });
});

transportPackagesRouter.get('/transport-options', async (req, res) => {
    const params = {
        from_location: req.query.from_location || null,
        to_location: req.query.to_location || null,
        package_type: req.query.package_type || null,
        budget_range: parseNumber(req.query.budget_range, null),
    };

    try {
        const { transports } = await getNormalizedTransportOptions();

        const filtered = applyTransportFilters(transports, {
            from: params.from_location,
            to: params.to_location,
            transport_type: params.package_type,
            max_price: params.budget_range,
            features: [],
        });

        const options = filtered.map((option) => ({
            id: option.id,
            name: option.name,
            description: option.route,
            image: option.image,
            price: option.price,
            type: option.type,
            route: option.route,
            features: option.features,
            estimated_duration: option.schedule?.duration || null,
            suitable_for_packages: true,
            package_discount: 10,
        }));

        return res.json({
            success: true,
            data: {
                transport_options: options,
            },
            message: 'Package transport options retrieved successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

transportPackagesRouter.post('/analyze-route', async (req, res) => {
    const payload = req.body || {};

    if (!payload.from_location || !payload.to_location) {
        return res.status(400).json({ success: false, message: 'from_location and to_location are required' });
    }

    try {
        const { transports } = await getNormalizedTransportOptions();

        const filtered = applyTransportFilters(transports, {
            from: payload.from_location,
            to: payload.to_location,
            transport_type: payload.preferences?.preferred_type || null,
            max_price: parseNumber(payload.package_budget, null),
            features: toArray(payload.preferences?.features),
        });

        const recommendedTransport = filtered[0] || null;
        const pricePoints = filtered
            .map((option) => option.price)
            .filter((price) => typeof price === 'number');

        const response = {
            from_location: payload.from_location,
            to_location: payload.to_location,
            distance: payload.distance || 0,
            estimated_duration: recommendedTransport?.schedule?.duration || 'Varies',
            available_transports: filtered,
            recommended_transport: recommendedTransport
                ? {
                    id: recommendedTransport.id,
                    name: recommendedTransport.name,
                    reason: 'Best match based on preferences',
                }
                : null,
            cost_comparison: {
                cheapest: filtered.reduce((cheapest, option) => {
                    if (!cheapest || option.price < cheapest.price) {
                        return option;
                    }
                    return cheapest;
                }, null),
                fastest: filtered.find((option) => option.schedule?.duration) || null,
                most_comfortable: filtered.find((option) => (option.amenities || []).length > 0) || null,
            },
        };

        if (pricePoints.length) {
            response.estimated_duration = recommendedTransport?.schedule?.duration || 'Varies';
            response.price_summary = {
                min: Math.min(...pricePoints),
                max: Math.max(...pricePoints),
                average: Number((pricePoints.reduce((sum, price) => sum + price, 0) / pricePoints.length).toFixed(2)),
            };
        }

        return res.json({
            success: true,
            data: response,
            message: 'Route analysis completed successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = {
    transportRouter,
    transportPackagesRouter,
};