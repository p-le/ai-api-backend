const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.json([{
      id: 1,
      username: "samsep01"
    }, {
      id: 2,
      username: "D0loresH4ze"
    }
  ])
})

module.exports = router;