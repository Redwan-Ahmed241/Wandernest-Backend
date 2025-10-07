const mongoose = require('mongoose');

const TransportOptionSchema = new mongoose.Schema({
    type: String,
    name: String,
    route: String,
    from_location: String,
    to_location: String,
    frequency: String,
    price: Number,
    currency: String,
    features: [String],
    rating: Number,
    availability: Boolean,
    operator: String,
    contact_info: {
        phone: String,
        website: String,
    },
    schedule: {
        departure_times: [String],
        stops: [String],
    },
    amenities: [String],
}, { timestamps: true });

module.exports = mongoose.model('TransportOption', TransportOptionSchema);