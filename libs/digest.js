const apiConfig = require('../config/api.config');
const crypto = require('crypto');

module.exports = (timestamp, md5sum) => {
  const checkMd5Sum = crypto.createHash('md5').update(`${timestamp}${apiConfig.hashKey}`).digest('hex')
  return md5sum === checkMd5Sum;
}