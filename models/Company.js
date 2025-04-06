// models/Company.js
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: false
  },
  rating: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    required: true
  },
  deliveryTime: {
    type: Number,
    required: true
  },
  categories: {
    type: [String],
    required: true
  },
  dishes: {
    type: [String],
    required: false
  },
  blockedUsers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  blockedRegions: {
    type: [String], // Aqui estamos armazenando os códigos postais das regiões bloqueadas
    default: []
  }
}, {
  timestamps: true
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;
