const express = require('express')
const cors = require('cors')
const path = require('path')
const multer = require('multer')
const morgan = require('morgan')

const bodyParser = require('body-parser')
const compression = require('compression')

const db = require('./config/db')
const mongoose = require('mongoose')
const File = require('./models/file')

const app = express()
const PORT = process.env.PORT || 2712

mongoose.Promise = global.Promise
mongoose.connect(db.url, {}, (err) => {
  if (err) console.log('Connection error')
  else {
    console.log('Connection OK')
  }
})

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, 'uploads'),
})
const upload =  multer({ storage })

app.use(compression())
  .use(morgan('dev'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(cors({
    origin: 'http://localhost:10000',
    optionsSuccessStatus: 200
  }))
  .use(express.static('public'))

app.post('/upload', upload.array('file[]'), async (req, res) => {
  let files = req.files
  files.map((file) => {
    console.log(file)
    const newFile = new File({
      filename: file.originalname,
      uploadedAt: new Date
    })
    newFile.save((err) => {
      if (err) {
        console.log('error')
      } else {
        console.log('aaa')
      }
    })
  })
  
  try {
    res.sendStatus(200)
  } catch (err) {
    res.sendStatus(400)
  }
})

app.listen(PORT, () => console.log(`API is running on ${PORT}`))


