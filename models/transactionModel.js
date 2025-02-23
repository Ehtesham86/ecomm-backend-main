const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  orderID: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  branchID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tnxID: { type: String },
  amount: { type: String },
  status: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
