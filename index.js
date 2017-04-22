const express = require('express')
const cors = require('cors')
const uuid = require('uuid/v4')
const path = require('path')
const multer = require('multer')
const compression = require('compression')

const app = express()
const PORT = process.env.PORT || 2712

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, 'uploads'),
  filename(req, file, cb) {
    console.log(file);
    cb(null, `${file.originalname}`)
  }
})
const upload =  multer({ storage })

app.use(compression())
  .use(cors({
    origin: 'http://localhost:10000',
    optionsSuccessStatus: 200
  }))

app.post('/upload', upload.array('file[]'), async (req, res) => {
  try {
    res.sendStatus(200)
  } catch (err) {
    res.sendStatus(400)
  }
})

app.listen(PORT, () => console.log(`API is running on ${PORT}`))


