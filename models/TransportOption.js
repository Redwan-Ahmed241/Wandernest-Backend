/**
 * Canonical transport option shape used to keep responses consistent with the
 * documentation in `PUBLIC_TRANSPORT_API_DOCUMENTATION.md`.
 */
const DEFAULT_TRANSPORT_OPTION = Object.freeze({
    id: null,
    type: null,
    name: null,
    route: null,
    from_location: null,
    to_location: null,
    frequency: null,
    price: null,
    currency: null,
    image: null,
    features: [],
    rating: null,
    availability: false,
    operator: null,
    contact_info: {
        phone: null,
        email: null,
        website: null,
    },
    schedule: {
        departure_times: [],
        duration: null,
        stops: [],
    },
    amenities: [],
    created_at: null,
    updated_at: null,
});

/**
 * Normalises a raw record (from Supabase or local JSON fallbacks) into the
 * structure expected by the Transport API consumers.
 *
 * @param {Record<string, any>} record
 * @returns {Record<string, any>}
 */
const deepCopy = (value) => JSON.parse(JSON.stringify(value));

const toTitleCase = (value) => {
    if (typeof value !== 'string') {
        return value;
    }

    return value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const normalizeTransportOption = (record = {}) => {
    const normalized = deepCopy(DEFAULT_TRANSPORT_OPTION);

    const simpleFields = [
        'id',
        'type',
        'name',
        'route',
        'from_location',
        'to_location',
        'frequency',
        'price',
        'currency',
        'image',
        'rating',
        'availability',
        'operator',
        'created_at',
        'updated_at',
    ];

    for (const field of simpleFields) {
        if (record[field] !== undefined && record[field] !== null) {
            normalized[field] = record[field];
        }
    }

    // Handle destination FKs
    if (normalized.from_location === null && record.from_destination) {
        normalized.from_location = record.from_destination.name || record.from_destination.city;
    }

    if (normalized.to_location === null && record.to_destination) {
        normalized.to_location = record.to_destination.name || record.to_destination.city;
    }

    if ((record.id === undefined || record.id === null) && record.transport_id !== undefined) {
        normalized.id = record.transport_id;
    }

    if (normalized.type === null && typeof record.transport_type === 'string') {
        normalized.type = record.transport_type;
    }

    if (typeof normalized.type === 'string') {
        normalized.type = toTitleCase(normalized.type.replace(/\s+/g, '_'));
    }

    if (normalized.route === null && record.from_location && record.to_location) {
        normalized.route = `${record.from_location} to ${record.to_location}`;
    }

    if (normalized.price === null && typeof record.price_chf === 'number') {
        normalized.price = record.price_chf;
        normalized.currency = normalized.currency || 'CHF';
    }

    if (normalized.price === null && typeof record.price_usd === 'number') {
        normalized.price = record.price_usd;
        normalized.currency = normalized.currency || 'USD';
    }

    if (normalized.currency === null && typeof record.currency_code === 'string') {
        normalized.currency = record.currency_code;
    }

    if (normalized.frequency === null && typeof record.interval_minutes === 'number') {
        normalized.frequency = `Every ${record.interval_minutes} minutes`;
    }

    normalized.features = Array.isArray(record.features) ? [...record.features] : [];
    normalized.amenities = Array.isArray(record.amenities) ? [...record.amenities] : [];

    const contactInfo = typeof record.contact_info === 'object' && record.contact_info !== null
        ? record.contact_info
        : {};
    normalized.contact_info = {
        ...normalized.contact_info,
        ...contactInfo,
    };

    const schedule = typeof record.schedule === 'object' && record.schedule !== null
        ? record.schedule
        : {};

    const departure_times = Array.isArray(schedule.departure_times)
        ? [...schedule.departure_times]
        : Array.isArray(record.departures)
            ? [...record.departures]
            : [];

    let duration = schedule.duration;
    if (!duration && typeof record.duration_minutes === 'number') {
        duration = `${record.duration_minutes} minutes`;
    }

    const stops = Array.isArray(schedule.stops)
        ? [...schedule.stops]
        : Array.isArray(record.stops)
            ? [...record.stops]
            : [];

    normalized.schedule = {
        ...normalized.schedule,
        ...schedule,
        departure_times,
        duration: duration || normalized.schedule.duration,
        stops,
    };

    return normalized;
};

module.exports = {
    DEFAULT_TRANSPORT_OPTION,
    normalizeTransportOption,
};