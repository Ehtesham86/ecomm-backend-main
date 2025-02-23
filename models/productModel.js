const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  image: { type: String, required: true },
  name: { type: String, required: true },
  sku: { type: String },
  price: { type: Number, required: true },
  vat: { type: Number},
  status: { type: String},
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
