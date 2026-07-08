const jwt = require('jsonwebtoken');

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    return null;
  }
};

const authCheck = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
};

const userCheck = (req, res, next) => {
  authCheck(req, res, () => {
    if (req.user.role !== 'User') {
      return res.status(403).json({ message: 'Access denied. User role required.' });
    }
    next();
  });
};

const adminCheck = (req, res, next) => {
  authCheck(req, res, () => {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    next();
  });
};

module.exports = {
  authCheck,
  userCheck,
  adminCheck
};
