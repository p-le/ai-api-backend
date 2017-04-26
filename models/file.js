const mongoose = require('mongoose')

const schema = mongoose.Schema({  
  filename: String,
  isProcessed: { type: Boolean, default: false },
  uploadedAt: Date
})

module.exports = mongoose.model('File', schema)