const express = require('express')
const http = require('http')
const cors = require('cors')
const bodyParser = require('body-parser')
const compression = require('compression')
const logger = require('./libs/logger')

const dataRouter = require('./routers/data')
const uploadRouter = require('./routers/upload')
const healthcheckRouter = require('./routers/healthcheck')

const PORT = process.env.PORT || 2712

if(!process.env.HASH_KEY) {
  throw(new Error('process.env.HASH_KEY Not Set'))
}

const app = express()
const server = http.Server(app)

server.listen(PORT, () => logger.info(`API is running on ${PORT}`))

app.use(compression())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(cors())

app.use('/api', dataRouter)
app.use('/api', uploadRouter)
app.use('/', healthcheckRouter)

