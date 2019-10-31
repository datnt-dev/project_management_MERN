const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  // get token from Header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'Không có token, quyền truy cập bị từ chối' });
  }

  // Verify token
  try {
    const decode = jwt.verify(token, config.get('jwtSecret'));

    req.user = decode.user;

    next();
    
  } catch (err) {
    res.status(401).json({msg: 'Token không hợp lệ'});
  }
}
