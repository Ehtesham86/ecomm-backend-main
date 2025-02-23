const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cardHolderName: { type: String },
    cardNumber: { type: String },
    expiryDate: { type: String },
    cvv: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Card', cardSchema);
