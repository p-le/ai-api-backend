const express = require('express')
const path = require('path')
const morgan = require('morgan')
const fs = require('fs')
const enableWs = require('express-ws')
// const cors = require('cors')
const event = require('events').EventEmitter();
const formidable = require('formidable')
const PythonShell = require('python-shell')
const bodyParser = require('body-parser')
const compression = require('compression')

// const whitelist = require('./config/origins')
const db = require('./config/db')
const mongoose = require('mongoose')
const File = require('./models/file')

const app = express()
enableWs(app)
const PORT = process.env.PORT || 2712

mongoose.Promise = global.Promise
mongoose.connect(db.url, {}, (err) => {
  if (err) console.log('Connection error')
  else {
    console.log('Connection OK')
  }
})

// const storage = multer.diskStorage({
//   destination: path.resolve(__dirname, 'inputs'),
//   filename(req, file, cb) {
//     cb(null, `${file.originalname}`)
//   }
// })
// const upload =  multer({ storage }).array('file[]')

app.use(compression())
  .use(morgan('tiny'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(express.static('public'))

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if ('OPTIONS' == req.method) {
    console.log('aaaaa')
    res.sendStatus(200);
  } else {
    next();
  }
});

app.post('/upload', async (req, res) => {
  const form = new formidable.IncomingForm()
  const results = []
  form.uploadDir = path.resolve(__dirname, 'inputs')
  form.keepExtensions = true
  form.multiples = true
  form.parse(req)

  form.on('file', (name, file) => {
    const newFile = new File({
      filename: file.name,
      uploadedAt: new Date
    })
    newFile.save((err, data) => {
      if (err) {
        res.sendStatus(400)
      }
      const filename = `${data.id}.${file.name.split('.').pop()}`
      fs.renameSync(file.path, `${form.uploadDir}/${filename}`)
      PythonShell.run('classifier.py', {
        scriptPath: path.resolve(__dirname, 'scripts'),
        args: [
          path.resolve(__dirname, `inputs/${filename}`),
          path.resolve(__dirname, `outputs/${filename}`),
          path.resolve(__dirname, 'scripts/random_forest_20170415_01.pkl')
        ]
      }, (err) => {
        if (err) console.log(err)
        else {
          results.push(data)
          event.emit('result', JSON.stringify(data))
        }
      })
    })

    form.on('end', () => {
      res.sendStatus(200)
    })
  })

  Promise
})

app.ws('/process', (ws, req) => {
  event.on('result', (data) => {
    ws.emit('result', data.id)
  })
})

app.listen(PORT, () => console.log(`API is running on ${PORT}`))


