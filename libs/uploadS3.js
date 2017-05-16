const AWS = require('aws-sdk')
const fs = require('fs')
const s3Config = require('../config/s3.config')
const logger = require('./logger')

const s3 = new AWS.S3({
  apiVersion: '2017-05-15',
  params: {
    Bucket: s3Config.bucketName
  }
});

module.exports = (timestamp, filename, key) => {
  logger.info(key)
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) reject(err)
      s3.upload({
        Key: key,
        Body: data,
        ACL: 'public-read'
      }, (err, result) => {
        if (err) {
          logger.info(err)
          reject(err)
        } else {
          logger.info(result)
          resolve(result)
        }
      })
    })
  });
};