const express = require('express')
const formidable = require('formidable')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const isDigestValid = require('../libs/digest')
const processFile = require('../libs/process')
const uploadS3 = require('../libs/uploadS3')

module.exports = router.post('/data', (req, res) => {
  const form = new formidable.IncomingForm();

  form.keepExtensions = true
  form.uploadDir = path.resolve(__dirname, '../tmp/data')

  form.on('fileBegin', (name, file) => {
    file.path = `${form.uploadDir}/${file.name}`
  })

  form.parse(req, async (err, fields, files) => {
    const timestamp = fields.timestamp
    const sum = fields.sum
    let uploadedFile = null

    if (err || !timestamp || !sum || !files)  {
      res.status(400).send({
        error: 'パラメーター不足'
      })
    }
    if (!isDigestValid(timestamp, sum)) {
      res.status(400).send({
        error: 'Md5sum不正'
      })
    }

    for (let property in files) {
      if (files.hasOwnProperty(property)) {
        uploadedFile = files[property]
      }
    }

    try {
      await processFile(uploadedFile)
    } catch(err) {
      fs.unlinkSync(path.resolve(__dirname, `../tmp/data/${uploadedFile.name}`))
      res.status(400).send({
        error: 'データフォマット不正'
      })
    }

    try {
      const s3ResultOrigin = await uploadS3(
        timestamp, 
        path.resolve(__dirname, `../tmp/data/${uploadedFile.name}`),
        `origin/${timestamp}/${uploadedFile.name}`
      )
      const s3Result = await uploadS3(
        timestamp, 
        path.resolve(__dirname, `../tmp/results/${uploadedFile.name}`),
        `results/${timestamp}/result_${uploadedFile.name}`
      )
      fs.unlinkSync(path.resolve(__dirname, `../tmp/data/${uploadedFile.name}`))
      fs.unlinkSync(path.resolve(__dirname, `../tmp/results/${uploadedFile.name}`))
      res.status(200).send({
        origin: s3ResultOrigin.Location,
        result: s3Result.Location
      })
    } catch (err) {
      fs.unlinkSync(path.resolve(__dirname, `../tmp/data/${uploadedFile.name}`))
      fs.unlinkSync(path.resolve(__dirname, `../tmp/results/${uploadedFile.name}`))
      res.status(500).send({
        error: 'サーバーエラー'
      })
    }
  })
})