const jwt = require('jsonwebtoken');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

console.log('JWT_ACCESS_SECRET length:', JWT_ACCESS_SECRET?.length);
console.log('JWT_REFRESH_SECRET length:', JWT_REFRESH_SECRET?.length);

const generateAccessToken = (user) => {
  return jwt.sign({ userId: user._id, role: user.role }, JWT_ACCESS_SECRET, {
    expiresIn: '15m'
  });
};

const generateRefreshToken = (user, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : '7d';
  return jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn });
};

const sendRefreshTokenCookie = (res, token, rememberMe = false) => {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days

  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: maxAge
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  sendRefreshTokenCookie,
  clearRefreshTokenCookie
};
