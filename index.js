const express = require('express')
const path = require('path')
const morgan = require('morgan')
const fs = require('fs')
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
          console.log(data)
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

socket.on('connection', function (s) {
  console.log(s.id)
});

event.on('result', (data) => {
  console.log(data)
  socket.emit('result', data.id)
})