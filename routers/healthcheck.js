const express = require('express');
const router = express.Router();

module.exports = router.get('/health', (req, res) => {
  res.sendStatus(200)
})