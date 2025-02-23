const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addressLine1: { type: String },
    addressLine2: { type: String },
    county: { type: String },
    postcode: { type: String },
    townCity: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Address', addressSchema);
