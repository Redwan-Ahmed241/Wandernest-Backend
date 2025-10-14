const DEFAULT_GUIDE = Object.freeze({
    id: null,
    name: null,
    description: null,
    image: null,
    price: null,
    hourly_rate: null,
    daily_rate: null,
    currency: null,
    area: null,
    specialties: [],
    languages: [],
    experience_years: null,
    rating: null,
    total_reviews: 0,
    availability: false,
    contact_info: {
        phone: null,
        email: null,
        whatsapp: null,
    },
    location: {
        city: null,
        region: null,
        country: null,
        coordinates: {
            latitude: null,
            longitude: null,
        },
    },
    services_offered: [],
    certifications: [],
    schedule: {
        working_hours: null,
        available_days: [],
        timezone: null,
    },
    pricing_details: {
        base_rate: null,
        group_discounts: [],
        package_rates: {
            half_day: null,
            full_day: null,
            multi_day: null,
        },
    },
    gallery: [],
    badges: [],
    created_at: null,
    updated_at: null,
});

const deepCopy = (value) => JSON.parse(JSON.stringify(value));

const normalizeGuide = (record = {}) => {
    const normalized = deepCopy(DEFAULT_GUIDE);

    const simpleFields = [
        'id',
        'name',
        'description',
        'image',
        'price',
        'hourly_rate',
        'daily_rate',
        'currency',
        'area',
        'experience_years',
        'rating',
        'total_reviews',
        'availability',
        'created_at',
        'updated_at',
    ];

    for (const field of simpleFields) {
        if (record[field] !== undefined && record[field] !== null) {
            normalized[field] = record[field];
        }
    }

    if ((record.id === undefined || record.id === null) && record.guide_id !== undefined) {
        normalized.id = record.guide_id;
    }

    if (normalized.currency === null && typeof record.currency_code === 'string') {
        normalized.currency = record.currency_code;
    }

    if (normalized.hourly_rate === null && typeof record.hourlyRate === 'number') {
        normalized.hourly_rate = record.hourlyRate;
    }

    if (normalized.daily_rate === null && typeof record.dailyRate === 'number') {
        normalized.daily_rate = record.dailyRate;
    }

    normalized.specialties = Array.isArray(record.specialties) ? [...record.specialties] : [];
    normalized.languages = Array.isArray(record.languages) ? [...record.languages] : [];
    normalized.services_offered = Array.isArray(record.services_offered)
        ? [...record.services_offered]
        : Array.isArray(record.services)
            ? [...record.services]
            : [];
    normalized.certifications = Array.isArray(record.certifications) ? [...record.certifications] : [];
    normalized.gallery = Array.isArray(record.gallery) ? [...record.gallery] : [];
    normalized.badges = Array.isArray(record.badges) ? [...record.badges] : [];

    const contactInfo = typeof record.contact_info === 'object' && record.contact_info !== null
        ? record.contact_info
        : {};
    normalized.contact_info = {
        ...normalized.contact_info,
        ...contactInfo,
    };

    // Handle location - either embedded or from destination FK
    let location = {};
    if (typeof record.location === 'object' && record.location !== null) {
        location = { ...record.location };
    } else if (typeof record.destination === 'object' && record.destination !== null) {
        // Use destination data for location
        location = {
            city: record.destination.city,
            region: record.destination.region,
            country: record.destination.country,
            coordinates: record.destination.coordinates,
        };
    }

    normalized.location = {
        ...normalized.location,
        ...location,
    };

    if (location.coordinates) {
        const coordinates = location.coordinates;
        normalized.location.coordinates = {
            ...normalized.location.coordinates,
            ...coordinates,
        };
    }

    const schedule = typeof record.schedule === 'object' && record.schedule !== null ? record.schedule : {};
    normalized.schedule = {
        ...normalized.schedule,
        ...schedule,
        available_days: Array.isArray(schedule.available_days) ? [...schedule.available_days] : [],
    };

    const pricingDetails = typeof record.pricing_details === 'object' && record.pricing_details !== null
        ? record.pricing_details
        : {};
    normalized.pricing_details = {
        ...normalized.pricing_details,
        ...pricingDetails,
        group_discounts: Array.isArray(pricingDetails.group_discounts)
            ? [...pricingDetails.group_discounts]
            : [],
        package_rates: {
            ...normalized.pricing_details.package_rates,
            ...(pricingDetails.package_rates || {}),
        },
    };

    if (normalized.pricing_details.base_rate === null && typeof record.price === 'number') {
        normalized.pricing_details.base_rate = record.price;
    }

    return normalized;
};

module.exports = {
    DEFAULT_GUIDE,
    normalizeGuide,
};