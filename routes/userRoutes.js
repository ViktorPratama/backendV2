import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/authMiddleware.js';

const userRoutes = (supabase) => {
  const router = express.Router();

  // Login endpoint
  router.post('/login', async (req, res) => {
    const { email, password } = req.body; // Mengambil data dari body

    try {
      // Cari user berdasarkan email
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, password, role') // Ambil kolom yang diperlukan
        .eq('email', email)
        .single();

      // Validasi email
      if (error || !data) {
        return res.status(401).json({ error: 'Email not found.' });
      }

      // Validasi password
      if (!bcrypt.compareSync(password, data.password)) {
        return res.status(401).json({ error: 'Incorrect password.' });
      }

      // Buat token JWT
      const token = jwt.sign(
        { id: data.id, role: data.role }, // Simpan data penting di token
        process.env.JWT_SECRET || 'secret-key', // Gunakan JWT_SECRET
        { expiresIn: '1h' } // Token berlaku 1 jam
      );

      // Kirim respons dengan token
      res.status(200).json({ message: 'Login successful.', token });
    } catch (err) {
      console.error(err); // Log error ke server
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // Profile endpoint
  router.get('/profile', verifyToken, async (req, res) => {
    try {
      // Ambil profil user berdasarkan ID dari token
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email') // Hanya ambil kolom yang diperlukan
        .eq('id', req.user.id)
        .single();

      // Validasi keberadaan user
      if (error || !data) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Kirim data profil
      res.status(200).json({ user: data });
    } catch (err) {
      console.error(err); // Log error ke server
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  return router;
};

export default userRoutes;
