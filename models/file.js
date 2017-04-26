const mongoose = require('mongoose')

const schema = mongoose.Schema({  
  name: String,
  size: Number,
  isProcessed: { type: Boolean, default: false },
  uploadedAt: Date
})

module.exports = mongoose.model('File', schema)