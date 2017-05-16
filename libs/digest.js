const crypto = require('crypto');
const hashKey = process.env.HASH_KEY

module.exports = (timestamp, md5sum) => {
  const checkMd5Sum = crypto.createHash('md5').update(`${timestamp}${hashKey}`).digest('hex')
  return md5sum === checkMd5Sum;
}