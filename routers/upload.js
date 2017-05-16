const express = require('express')
const formidable = require('formidable')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const dateFormat = require('dateformat')
const logger = require('../libs/logger')
const processFile = require('../libs/process')
const uploadS3 = require('../libs/uploadS3')

module.exports = router.post('/upload', (req, res) => {
  logger.info('Receiving Request')

  const form = new formidable.IncomingForm();
  const timestamp = dateFormat(new Date(), "yyyymmdd");
  form.keepExtensions = true
  form.uploadDir = path.resolve(__dirname, '../tmp/data')

  form.on('fileBegin', (name, file) => {
    file.path = `${form.uploadDir}/${file.name}`
  })

  form.parse(req, async (err, fields, files) => {
    let uploadedFile = null

    if (err)  {
      res.sendStatus(400)
      return
    }

    if (!files) {
      logger.info('無効なファイル')
      res.status(400).send({
        error: '無効なファイル'
      })
      return;
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
      return
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
      return
    }
  })
})