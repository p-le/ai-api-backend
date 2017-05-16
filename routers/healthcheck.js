const express = require('express');
const router = express.Router();

module.exports = router.get('/heath', (req, res) => {
  res.sendStatus(200)
})