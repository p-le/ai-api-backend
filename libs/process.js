const PythonShell = require('python-shell')
const logger = require('./logger')
const path = require('path')
module.exports = (file) => {
  const shell = new PythonShell('classifier.py', {
    scriptPath: path.resolve(__dirname, '../scripts'),
    args: [
      path.resolve(__dirname, `../tmp/data/${file.name}`),
      path.resolve(__dirname, `../tmp/results/${file.name}`),
      path.resolve(__dirname, '../scripts/random_forest_20170415_01.pkl')
    ]
  })
  return new Promise((resolve, reject) => {
    shell.end((err) => {
      if (err) {
        logger.info(err)
        reject(err)
      } else {
        logger.info(`Processed ${file.name}`)
        resolve('Processed')
      }
    })
  })
}