const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.write('Welcome DaTA API');
})

module.exports = router;