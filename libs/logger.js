const winston = require('winston')
const path = require('path')
require('winston-daily-rotate-file')

const env = process.env.NODE_ENV || 'dev';

const tsFormat = () => (new Date()).toLocaleTimeString();

const logger = new (winston.Logger) ({
  transports: [
    new (winston.transports.Console) ({
      timestamp: tsFormat,
      colorize: true,
      level: 'info'
    }),
    new (winston.transports.DailyRotateFile) ({
      filename: path.resolve(__dirname, '../logs/api.log'),
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      timestamp: tsFormat,
      level: env === 'development' ? 'debug' : 'info'
    })
  ]
});

module.exports = logger