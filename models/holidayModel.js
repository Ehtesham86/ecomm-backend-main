const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  holidays: [Date],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Holiday', holidaySchema);
