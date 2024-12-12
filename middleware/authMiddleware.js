// authMiddleware.js
import jwt from 'jsonwebtoken'; // Menggunakan import alih-alih require
import dotenv from 'dotenv';
dotenv.config(); // Pastikan memanggil ini sebelum menggunakan variabel lingkungan

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1]; // Ambil token setelah "Bearer"
  console.log('Token received:', token);  // Log token yang diterima
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'Viktor1234567890!@#$%^&*()');
    console.log('Decoded token:', decoded);  // Log hasil decode token
    req.user = decoded; // Tambahkan data pengguna ke req
    next(); // Lanjutkan ke handler berikutnya
  } catch (err) {
    console.error('JWT Error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};
