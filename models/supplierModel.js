const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  icon: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    postcode: { type: String },
  },
  holidays: { type: mongoose.Schema.Types.ObjectId, ref: 'Holiday' },
  status: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Supplier', supplierSchema);
