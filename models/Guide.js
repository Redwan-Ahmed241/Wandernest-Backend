const mongoose = require('mongoose');

const GuideSchema = new mongoose.Schema({
    name: String,
    description: String,
    image: String,
    price: Number,
    area: String,
    specialties: [String],
    languages: [String],
    experience_years: Number,
    rating: Number,
    availability: Boolean,
    contact_info: {
        phone: String,
        whatsapp: String,
    },
    location: {
        city: String,
    },
    services_offered: [String],
    certifications: [String],
}, { timestamps: true });

module.exports = mongoose.model('Guide', GuideSchema);