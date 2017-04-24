const mongoose = require('mongoose')

const schema = mongoose.Schema({  
  filename: String,
  uploadedAt: Date
})

module.exports = mongoose.model('File', schema)