const crypto = require('crypto');

function generateTempPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from(crypto.randomBytes(length))
    .map(b => chars[b % chars.length])
    .join('');
}

module.exports = { generateTempPassword };
