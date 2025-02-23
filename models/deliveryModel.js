const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    days: [String],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Delivery', deliverySchema);
