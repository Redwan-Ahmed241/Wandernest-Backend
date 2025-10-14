const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const guidesRouter = express.Router();
const guidePackagesRouter = express.Router();

const supabase = require('../../utils/supabaseClient');
const { normalizeGuide } = require('../../models/Guide');

const localGuidesFile = path.resolve(__dirname, '../../data/guides.json');

let cachedLocalGuides = null;

const inMemoryGuideState = {
    bookings: [],
    reviews: new Map(),
    profile: null,
};

const DEFAULT_PAGE_SIZE = 20;
const BOOKING_PREFIX = 'GDB-';
const BOOKING_REFERENCE_PREFIX = 'AR';

const randomId = (prefix = '') => {
    if (typeof crypto.randomUUID === 'function') {
        return `${prefix}${crypto.randomUUID()}`;
    }

    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
};

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
            // Ignore JSON parse failure and fall back to comma split
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

const parseGuideId = (rawGuideId) => {
    if (rawGuideId === undefined || rawGuideId === null) {
        return rawGuideId;
    }

    const numeric = Number(rawGuideId);
    return Number.isNaN(numeric) ? rawGuideId : numeric;
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

    if (params.location) filters.location = params.location;
    if (params.area) filters.area = params.area;
    if (params.specialties.length) filters.specialties = params.specialties;
    if (params.languages.length) filters.languages = params.languages;
    if (params.max_price !== null) filters.max_price = params.max_price;
    if (params.min_rating !== null) filters.min_rating = params.min_rating;
    if (params.experience_years !== null) filters.experience_years = params.experience_years;
    if (params.services.length) filters.services = params.services;
    if (params.availability_date) filters.availability_date = params.availability_date;

    return filters;
};

const applyGuideFilters = (guides, params) => guides.filter((guide) => {
    if (params.location) {
        const locationNeedle = params.location.trim().toLowerCase();
        const haystack = [guide.area, guide.location?.city, guide.location?.region, guide.location?.country]
            .filter(Boolean)
            .map((value) => value.trim().toLowerCase());

        if (!haystack.includes(locationNeedle)) {
            return false;
        }
    }

    if (params.area) {
        const areaMatch = String(guide.area || '').trim().toLowerCase() === params.area.trim().toLowerCase();
        if (!areaMatch) {
            return false;
        }
    }

    if (params.specialties.length > 0) {
        const guideSpecialties = Array.isArray(guide.specialties)
            ? guide.specialties.map((entry) => String(entry).toLowerCase())
            : [];
        const requestedSpecialties = params.specialties.map((entry) => String(entry).toLowerCase());

        const hasAllSpecialties = requestedSpecialties.every((specialty) => guideSpecialties.includes(specialty));
        if (!hasAllSpecialties) {
            return false;
        }
    }

    if (params.languages.length > 0) {
        const guideLanguages = Array.isArray(guide.languages)
            ? guide.languages.map((entry) => String(entry).toLowerCase())
            : [];
        const requestedLanguages = params.languages.map((entry) => String(entry).toLowerCase());

        const hasLanguages = requestedLanguages.every((language) => guideLanguages.includes(language));
        if (!hasLanguages) {
            return false;
        }
    }

    if (params.services.length > 0) {
        const guideServices = Array.isArray(guide.services_offered)
            ? guide.services_offered.map((entry) => String(entry).toLowerCase())
            : [];
        const requestedServices = params.services.map((entry) => String(entry).toLowerCase());

        const hasServices = requestedServices.every((service) => guideServices.includes(service));
        if (!hasServices) {
            return false;
        }
    }

    if (params.max_price !== null && typeof guide.price === 'number') {
        if (guide.price > params.max_price) {
            return false;
        }
    }

    if (params.min_rating !== null && typeof guide.rating === 'number') {
        if (guide.rating < params.min_rating) {
            return false;
        }
    }

    if (params.experience_years !== null && typeof guide.experience_years === 'number') {
        if (guide.experience_years < params.experience_years) {
            return false;
        }
    }

    if (params.availability_date) {
        if (guide.availability === false) {
            return false;
        }
    }

    return true;
});

const sortGuides = (guides, sortBy, sortOrder) => {
    if (!sortBy) {
        return guides;
    }

    const direction = sortOrder === 'desc' ? -1 : 1;
    const sorted = [...guides];

    sorted.sort((a, b) => {
        const getValue = (guide, field) => {
            switch (field) {
                case 'price':
                    return typeof guide.price === 'number' ? guide.price : Number.POSITIVE_INFINITY;
                case 'rating':
                    return typeof guide.rating === 'number' ? guide.rating : -Number.POSITIVE_INFINITY;
                case 'experience':
                    return typeof guide.experience_years === 'number' ? guide.experience_years : -Number.POSITIVE_INFINITY;
                case 'reviews':
                    return typeof guide.total_reviews === 'number' ? guide.total_reviews : -Number.POSITIVE_INFINITY;
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

const fetchGuidesDataset = async () => {
    // Try Supabase first if configured
    if (supabase.isConfigured) {
        // Try with destination FK join first
        let query = supabase.from('guides').select('*');
        let data, error;

        try {
            // Attempt join with destinations if FK exists
            const result = await supabase
                .from('guides')
                .select('*, destination:destinations(*)');
            data = result.data;
            error = result.error;
        } catch (joinError) {
            // Fallback to simple select if FK doesn't exist
            console.warn('[Guides] Destination FK not found, using embedded location data:', joinError.message);
            const result = await supabase.from('guides').select('*');
            data = result.data;
            error = result.error;
        }

        if (!error && data && data.length > 0) {
            return { items: data, source: 'supabase' };
        }
    }

    // Fallback to local data if Supabase fails or isn't configured
    const localData = loadLocalGuides();
    return { items: localData, source: 'local' };
};

const getNormalizedGuides = async () => {
    const dataset = await fetchGuidesDataset();

    if (dataset.error) {
        throw dataset.error;
    }

    return {
        guides: dataset.items.map((item) => normalizeGuide(item)),
        source: dataset.source,
        warning: dataset.warning || null,
    };
};

const findGuideById = async (rawGuideId) => {
    const guideId = parseGuideId(rawGuideId);
    const { guides } = await getNormalizedGuides();

    return guides.find((guide) => String(guide.id) === String(guideId)) || null;
};

const ensureProfileSeed = async () => {
    if (inMemoryGuideState.profile) {
        return inMemoryGuideState.profile;
    }

    const { guides } = await getNormalizedGuides();
    const primaryGuide = guides[0] || null;

    if (primaryGuide) {
        inMemoryGuideState.profile = {
            ...primaryGuide,
            biography: primaryGuide.description,
            response_time: 'Within 2 hours',
            completed_tours: 0,
        };
    } else {
        inMemoryGuideState.profile = {
            id: randomId('guide_'),
            name: 'Guide Profile',
            biography: '',
            response_time: 'Within 24 hours',
            completed_tours: 0,
        };
    }

    return inMemoryGuideState.profile;
};

const getReviewsForGuide = async (guide) => {
    const key = String(guide.id);

    if (!inMemoryGuideState.reviews.has(key)) {
        const sampleReview = {
            id: randomId('review_'),
            guide_id: key,
            user_id: 'user_demo',
            user_name: 'Demo Traveler',
            rating: guide.rating || 4.5,
            comment: `Had a wonderful experience with ${guide.name || 'this guide'}.`,
            service_type: 'daily',
            booking_date: new Date().toISOString().split('T')[0],
            helpful_votes: 0,
            verified_booking: false,
            created_at: new Date().toISOString(),
            images: [],
        };

        inMemoryGuideState.reviews.set(key, [sampleReview]);
    }

    return inMemoryGuideState.reviews.get(key);
};

const computeRatingDistribution = (reviews) => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((review) => {
        const rating = Math.round(parseNumber(review.rating, 0));
        if (distribution[rating] !== undefined) {
            distribution[rating] += 1;
        }
    });

    return distribution;
};

const generateGuideAvailability = (guide, startDate, days) => {
    const dailySlots = [
        {
            start_time: '09:00',
            end_time: '13:00',
            service_type: 'half_day',
            max_group_size: 8,
            price: guide.pricing_details?.package_rates?.half_day || guide.price || 0,
        },
        {
            start_time: '14:00',
            end_time: '18:00',
            service_type: 'half_day',
            max_group_size: 8,
            price: guide.pricing_details?.package_rates?.half_day || guide.price || 0,
        },
        {
            start_time: '09:00',
            end_time: '18:00',
            service_type: 'daily',
            max_group_size: 8,
            price: guide.pricing_details?.base_rate || guide.price || 0,
        },
    ];

    const results = [];
    const baseDate = new Date(startDate);

    for (let index = 0; index < days; index += 1) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + index);

        const isoDate = date.toISOString().split('T')[0];

        results.push({
            guide_id: String(guide.id),
            date: isoDate,
            available_slots: dailySlots,
            booked_slots: [],
            unavailable_periods: [],
        });
    }

    return results;
};

guidesRouter.get('/', async (req, res) => {
    const params = {
        location: req.query.location || null,
        area: req.query.area || null,
        specialties: toArray(req.query.specialties),
        languages: toArray(req.query.languages),
        max_price: parseNumber(req.query.max_price, null),
        min_rating: parseNumber(req.query.min_rating, null),
        experience_years: parseNumber(req.query.experience_years, null),
        services: toArray(req.query.services),
        availability_date: req.query.availability_date || null,
        sort_by: req.query.sort_by || null,
        sort_order: req.query.sort_order || 'asc',
        page: parseNumber(req.query.page, 1),
        limit: parseNumber(req.query.limit, DEFAULT_PAGE_SIZE),
    };

    try {
        const { guides, source } = await getNormalizedGuides();

        const filtered = applyGuideFilters(guides, params);
        const sorted = sortGuides(filtered, params.sort_by, params.sort_order);
        const pagination = paginate(sorted, params.page, params.limit || DEFAULT_PAGE_SIZE);

        return res.json({
            success: true,
            data: {
                guides: pagination.items,
                total_results: pagination.total,
                page: pagination.page,
                total_pages: pagination.totalPages,
                filters_applied: buildFiltersApplied(params),
            },
            message: 'Guides retrieved successfully',
            meta: { source },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

guidesRouter.post('/search', async (req, res) => {
    const params = {
        location: req.body.location || null,
        area: req.body.area || null,
        specialties: toArray(req.body.specialties),
        languages: toArray(req.body.languages),
        max_price: parseNumber(req.body.max_price, null),
        min_rating: parseNumber(req.body.min_rating, null),
        experience_years: parseNumber(req.body.experience_years, null),
        services: toArray(req.body.services),
        availability_date: req.body.availability_date || null,
        sort_by: req.body.sort_by || null,
        sort_order: req.body.sort_order || 'asc',
        page: parseNumber(req.body.page, 1),
        limit: parseNumber(req.body.limit, DEFAULT_PAGE_SIZE),
    };

    try {
        const { guides, source } = await getNormalizedGuides();

        const filtered = applyGuideFilters(guides, params);
        const sorted = sortGuides(filtered, params.sort_by, params.sort_order);
        const pagination = paginate(sorted, params.page, params.limit || DEFAULT_PAGE_SIZE);

        return res.json({
            success: true,
            data: {
                guides: pagination.items,
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

guidesRouter.get('/profile', async (req, res) => {
    try {
        const profile = await ensureProfileSeed();

        return res.json({ success: true, data: profile, message: 'Guide profile retrieved successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

guidesRouter.patch('/profile', async (req, res) => {
    try {
        const profile = await ensureProfileSeed();
        Object.assign(profile, req.body || {});
        profile.updated_at = new Date().toISOString();

        return res.json({ success: true, data: profile, message: 'Guide profile updated successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

guidesRouter.patch('/availability', async (req, res) => {
    try {
        const profile = await ensureProfileSeed();
        profile.schedule = {
            ...profile.schedule,
            ...req.body.schedule,
        };

        return res.json({ success: true, data: profile.schedule, message: 'Availability updated successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

guidesRouter.get('/earnings', (req, res) => {
    const currency = req.query.currency || 'USD';
    const confirmedBookings = inMemoryGuideState.bookings.filter((booking) => booking.status === 'confirmed');
    const pendingBookings = inMemoryGuideState.bookings.filter((booking) => booking.status === 'pending');

    const totalEarnings = confirmedBookings.reduce((sum, booking) => sum + parseNumber(booking.total_amount, 0), 0);
    const upcoming = pendingBookings.reduce((sum, booking) => sum + parseNumber(booking.total_amount, 0), 0);

    return res.json({
        success: true,
        data: {
            total_earnings: Number(totalEarnings.toFixed(2)),
            pending_payouts: Number(upcoming.toFixed(2)),
            upcoming_bookings: pendingBookings.length,
            currency,
            breakdown: confirmedBookings.map((booking) => ({
                booking_id: booking.booking_id,
                amount: booking.total_amount,
                date: booking.service_details?.date || null,
                status: booking.status,
            })),
        },
        message: 'Guide earnings retrieved successfully',
    });
});

guidesRouter.get('/:guide_id', async (req, res) => {
    const { guide_id: rawGuideId } = req.params;

    if (!rawGuideId) {
        return res.status(400).json({ success: false, message: 'Guide ID is required' });
    }

    try {
        const guide = await findGuideById(rawGuideId);

        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }

        return res.json({
            success: true,
            data: guide,
            message: 'Guide details retrieved successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

guidesRouter.get('/:guide_id/availability', async (req, res) => {
    const { guide_id: rawGuideId } = req.params;
    const { date, days = 1 } = req.query;

    if (!date) {
        return res.status(400).json({ success: false, message: 'Query parameter "date" is required' });
    }

    try {
        const guide = await findGuideById(rawGuideId);

        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }

        const availability = generateGuideAvailability(guide, date, parseNumber(days, 1));
        const availabilityEnvelope = availability[0] || null;

        return res.json({
            success: true,
            data: availabilityEnvelope,
            message: 'Availability retrieved successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

guidesRouter.post('/bookings', async (req, res) => {
    const payload = req.body || {};

    if (!payload.guide_id) {
        return res.status(400).json({ success: false, message: 'guide_id is required' });
    }

    if (!payload.booking_date) {
        return res.status(400).json({ success: false, message: 'booking_date is required' });
    }

    if (!payload.contact_email) {
        return res.status(400).json({ success: false, message: 'contact_email is required' });
    }

    try {
        const guide = await findGuideById(payload.guide_id);

        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }

        const bookingId = `${BOOKING_PREFIX}${String(inMemoryGuideState.bookings.length + 1).padStart(3, '0')}`;
        const bookingReference = `${BOOKING_REFERENCE_PREFIX}-${payload.booking_date.replace(/-/g, '')}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;

        const booking = {
            booking_id: bookingId,
            booking_reference: bookingReference,
            status: payload.status || 'pending',
            guide_details: {
                id: guide.id,
                name: guide.name,
                contact: guide.contact_info?.phone || null,
                rating: guide.rating,
            },
            service_details: {
                service_type: payload.service_type || 'daily',
                date: payload.booking_date,
                duration: payload.duration_hours ? `${payload.duration_hours} hours` : payload.duration_days ? `${payload.duration_days} days` : null,
                meeting_point: payload.meeting_point || null,
            },
            total_amount: payload.total_price || guide.price || 0,
            payment_status: payload.payment_status || 'pending',
            confirmation_details: payload.confirmation_details || null,
            created_at: new Date().toISOString(),
            guide_id: guide.id,
            contact_email: payload.contact_email,
            contact_phone: payload.contact_phone || null,
        };

        inMemoryGuideState.bookings.push(booking);

        return res.status(201).json({
            success: true,
            data: booking,
            message: 'Booking created successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

guidesRouter.get('/bookings/my-bookings', (req, res) => {
    const { status, date_from: dateFrom, date_to: dateTo } = req.query;

    let bookings = [...inMemoryGuideState.bookings];

    if (status) {
        bookings = bookings.filter((booking) => booking.status === status);
    }

    if (dateFrom) {
        bookings = bookings.filter((booking) => booking.service_details?.date >= dateFrom);
    }

    if (dateTo) {
        bookings = bookings.filter((booking) => booking.service_details?.date <= dateTo);
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

guidesRouter.get('/bookings/:booking_id', (req, res) => {
    const booking = inMemoryGuideState.bookings.find((entry) => entry.booking_id === req.params.booking_id);

    if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.json({ success: true, data: booking, message: 'Booking details retrieved successfully' });
});

guidesRouter.patch('/bookings/:booking_id', (req, res) => {
    const booking = inMemoryGuideState.bookings.find((entry) => entry.booking_id === req.params.booking_id);

    if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    Object.assign(booking, req.body || {});
    booking.updated_at = new Date().toISOString();

    return res.json({ success: true, data: booking, message: 'Booking updated successfully' });
});

guidesRouter.delete('/bookings/:booking_id', (req, res) => {
    const previousLength = inMemoryGuideState.bookings.length;
    inMemoryGuideState.bookings = inMemoryGuideState.bookings.filter((entry) => entry.booking_id !== req.params.booking_id);

    if (inMemoryGuideState.bookings.length === previousLength) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.json({ success: true, message: 'Booking cancelled successfully' });
});

guidesRouter.get('/:guide_id/reviews', async (req, res) => {
    try {
        const guide = await findGuideById(req.params.guide_id);

        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }

        const reviews = await getReviewsForGuide(guide);
        const totalReviews = reviews.length;
        const averageRating = totalReviews === 0
            ? 0
            : reviews.reduce((sum, review) => sum + parseNumber(review.rating, 0), 0) / totalReviews;
        const ratingDistribution = computeRatingDistribution(reviews);

        return res.json({
            success: true,
            data: {
                reviews,
                total_reviews: totalReviews,
                average_rating: Number(averageRating.toFixed(2)),
                rating_distribution: ratingDistribution,
            },
            message: 'Reviews retrieved successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

guidesRouter.post('/:guide_id/reviews', async (req, res) => {
    const payload = req.body || {};

    if (!payload.rating) {
        return res.status(400).json({ success: false, message: 'rating is required' });
    }

    try {
        const guide = await findGuideById(req.params.guide_id);

        if (!guide) {
            return res.status(404).json({ success: false, message: 'Guide not found' });
        }

        const reviews = await getReviewsForGuide(guide);
        const newReview = {
            id: randomId('review_'),
            guide_id: String(guide.id),
            user_id: payload.user_id || randomId('user_'),
            user_name: payload.user_name || 'Anonymous Traveler',
            rating: parseNumber(payload.rating, 0),
            comment: payload.comment || '',
            service_type: payload.service_type || 'daily',
            booking_date: payload.booking_date || new Date().toISOString().split('T')[0],
            helpful_votes: 0,
            verified_booking: Boolean(payload.verified_booking),
            created_at: new Date().toISOString(),
            images: toArray(payload.images),
        };

        reviews.push(newReview);

        return res.status(201).json({
            success: true,
            data: newReview,
            message: 'Review submitted successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

guidePackagesRouter.get('/guide-options', async (req, res) => {
    const params = {
        location: req.query.location || null,
        specialties: toArray(req.query.specialties),
        budget_range: parseNumber(req.query.budget_range, null),
    };

    try {
        const { guides } = await getNormalizedGuides();
        let options = applyGuideFilters(guides, {
            ...params,
            area: null,
            languages: [],
            max_price: params.budget_range,
            min_rating: null,
            experience_years: null,
            services: [],
            availability_date: null,
        });

        options = options.map((guide) => ({
            id: guide.id,
            name: guide.name,
            description: guide.description,
            image: guide.image,
            price: guide.price,
            area: guide.area,
            specialties: guide.specialties,
            rating: guide.rating,
            suitable_for_packages: true,
        }));

        return res.json({
            success: true,
            data: {
                guide_options: options,
            },
            message: 'Package guide options retrieved successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

guidePackagesRouter.post('/analyze-location-guides', async (req, res) => {
    const payload = req.body || {};

    if (!payload.location) {
        return res.status(400).json({ success: false, message: 'location is required' });
    }

    try {
        const { guides } = await getNormalizedGuides();
        const filtered = applyGuideFilters(guides, {
            location: payload.location,
            area: null,
            specialties: toArray(payload.preferences?.interests),
            languages: toArray(payload.preferences?.languages),
            max_price: parseNumber(payload.budget, null),
            min_rating: parseNumber(payload.preferences?.min_rating, null),
            experience_years: parseNumber(payload.preferences?.experience_level === 'expert' ? 5 : null, null),
            services: toArray(payload.preferences?.activities),
            availability_date: null,
        });

        const recommended = filtered.slice(0, 3).map((guide, index) => ({
            guide,
            match_score: Number((0.9 - index * 0.1).toFixed(2)),
            reasons: ['Matches requested specialties', 'High rating'],
            estimated_cost: guide.price || 0,
            availability_status: guide.availability ? 'available' : 'limited',
        }));

        const pricePoints = filtered
            .map((guide) => guide.price)
            .filter((price) => typeof price === 'number');

        const response = {
            location: payload.location,
            available_guides: filtered,
            recommended_guides: recommended,
            specialties_available: Array.from(new Set(filtered.flatMap((guide) => guide.specialties || []))),
            price_range: {
                min: pricePoints.length ? Math.min(...pricePoints) : null,
                max: pricePoints.length ? Math.max(...pricePoints) : null,
                average: pricePoints.length
                    ? Number((pricePoints.reduce((sum, price) => sum + price, 0) / pricePoints.length).toFixed(2))
                    : null,
            },
            popular_services: Array.from(new Set(filtered.flatMap((guide) => guide.services_offered || []))).slice(0, 5),
        };

        return res.json({
            success: true,
            data: response,
            message: 'Location guide analysis completed successfully',
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = guidesRouter;