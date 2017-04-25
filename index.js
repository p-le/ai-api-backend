const express = require('express')
const cors = require('cors')
const path = require('path')
const multer = require('multer')
const morgan = require('morgan')
const PythonShell = require('python-shell')
const bodyParser = require('body-parser')
const compression = require('compression')

const frontend = require('./config/frontend')
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
  destination: path.resolve(__dirname, 'inputs'),
  filename(req, file, cb) {
    cb(null, `${file.originalname}`)
  }
})
const upload =  multer({ storage })

app.use(compression())
  .use(morgan('dev'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(cors({
    origin: (process.env.NODE_ENV === 'prod') ? frontend.prod.origin : frontend.dev.origin,
    optionsSuccessStatus: 200
  }))
  .use(express.static('public'))

app.post('/upload', upload.array('file[]'), async (req, res) => {
  try {
    let files = req.files
    files.map((file) => {
      const newFile = new File({
        filename: file.originalname,
        uploadedAt: new Date
      })
      newFile.save((err, file) => {
        if (err) {
          console.log('error')
        } else {
          console.log(file.id)
        }
      })
      PythonShell.run('classifier.py', {
        scriptPath: path.resolve(__dirname, 'scripts'),
        args: [
          path.resolve(__dirname, 'scripts/test_20170421.tsv'),
          path.resolve(__dirname, 'outputs/pred_test_haha.tsv'),
          path.resolve(__dirname, 'scripts/random_forest_20170415_01.pkl')
        ]
      }, (err) => {
        if (err) console.log(err)
        else {
          console.log('finished')
        }
      })
    })
    res.sendStatus(200)
  } catch (err) {
    res.sendStatus(400)
  }
})

app.listen(PORT, () => console.log(`API is running on ${PORT}`))


