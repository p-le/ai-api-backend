const express = require('express')
const path = require('path')
const morgan = require('morgan')
const fs = require('fs')
const mime = require('mime')
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
    const fileDir = `outputs/${id}.${file.name.split('.').pop()}`

    res.setHeader('Content-disposition', 'attachment; filename=result_' + file.name);
    res.setHeader('Content-type', `${mime.lookup(fileDir)}; charset=utf-8`)
    const stream = fs.createReadStream(path.resolve(__dirname, fileDir))
    stream.pipe(res)
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" })
  }
});

app.get('/history', async (req, res) => {
  try {
    const files = await File.find({}).exec()
    console.log(files)
    res.status(200).json(files)
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

app.post('/upload', (req, res) => {
  const form = new formidable.IncomingForm()
  const dbFiles = []
  form.uploadDir = path.resolve(__dirname, 'inputs')
  form.keepExtensions = true
  form.multiples = true
  form.parse(req)

  form.on('fileBegin', (name, file) => {
    const newFile = new File({
      name: file.name,
      size: file.size,
      uploadedAt: new Date
    })
    file.path = `${form.uploadDir}/${newFile._id}.${file.name.split('.').pop()}`
    dbFiles.push(newFile)
  })

  form.on('file', (name, file) => {
    for (let f of dbFiles ) {
      if (file.path.includes(f._id)) {
        f.size = file.size
      }
    }
  })

  form.on('end', async () => {
    try {
      for (let f of dbFiles) {
        await f.save()
      }
      event.emit('process', (dbFiles))
      res.status(200).json(dbFiles)
    } catch (err) {
      res.status(500).json({ error: ""})
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

event.on('result', async (file) => {
  file.isProcessed = true
  const updatedFile = await file.save()
  socket.emit('result', JSON.stringify(updatedFile))
})