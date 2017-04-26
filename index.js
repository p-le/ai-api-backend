const express = require('express')
const path = require('path')
const morgan = require('morgan')
const fs = require('fs')
var mime = require('mime')
const http = require('http')
const io = require('socket.io')
const cors = require('cors')
const EventEmitter  = require('events');
const formidable = require('formidable')
const PythonShell = require('python-shell')
const bodyParser = require('body-parser')
const compression = require('compression')

const db = require('./config/db')
const mongoose = require('mongoose')
const File = require('./models/file')

const PORT = process.env.PORT || 2712
const app = express()
const server = http.Server(app)
const socket = io(server, {
  path: '/process'
})
server.listen(PORT, () => console.log(`API is running on ${PORT}`))
const event = new EventEmitter()

mongoose.Promise = global.Promise
mongoose.connect(db.url, {}, (err) => {
  if (err) console.log('Connection error')
  else {
    console.log('Connection OK')
  }
})

app.use(compression())
  .use(morgan('tiny'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(express.static('public'))
  .use(cors())

app.get('/result/:id', async (req, res) => {
  try {
    const id = req.params.id
    const file = await File.findById(id)
    res.setHeader('Content-disposition', 'attachment; filename=result_' + file.name);
    const stream = fs.createReadStream(path.resolve(__dirname, `outputs/${id}.${file.name.split('.').pop()}`))
    stream.pipe(res)
  } catch (err) {
    res.status(500).json(err)
  }
});

app.post('/upload', (req, res) => {
  const form = new formidable.IncomingForm()
  const files = []
  form.uploadDir = path.resolve(__dirname, 'inputs')
  form.keepExtensions = true
  form.multiples = true
  form.parse(req)

  form.on('fileBegin', (name, file) => {
    console.log(file)
    const newFile = new File({
      name: file.name,
      size: file.size,
      uploadedAt: new Date
    })
    file.path = `${form.uploadDir}/${newFile._id}.${file.name.split('.').pop()}`
    files.push(newFile)
  })
  form.on('end', async () => {
    try {
      for (let file of files) {
        await file.save()
      }
      event.emit('process', (files))
      res.status(200).json(files)
    } catch (err) {
      res.status(500).json(err)
    }
  })
})

socket.on('connection', function (s) {
  console.log(s.id)
});

event.on('process', (files) => {
  for (let file of files) {
    PythonShell.run('classifier.py', {
      scriptPath: path.resolve(__dirname, 'scripts'),
      args: [
        path.resolve(__dirname, `inputs/${file._id}.${file.name.split('.').pop()}`),
        path.resolve(__dirname, `outputs/${file._id}.${file.name.split('.').pop()}`),
        path.resolve(__dirname, 'scripts/random_forest_20170415_01.pkl')
      ]
    }, (err) => {
      if (err) console.log(err)
      else {
        file.isProcessed = true
        event.emit('result', file)
      }
    })
  }
})

event.on('result', (file) => {
  socket.emit('result', JSON.stringify(file))
})