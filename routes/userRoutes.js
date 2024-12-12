import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/authMiddleware.js';

const userRoutes = (supabase) => {
  const router = express.Router();

  // Login endpoint
  router.get('/login', async (req, res) => {
    const { email, password } = req.query;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data || !bcrypt.compareSync(password, data.password)) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { id: data.id, role: data.role },
        process.env.JWT_SECRET || 'secret-key',
        { expiresIn: '1h' }
      );

      res.status(200).json({ message: 'Login successful.', token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  // Profile endpoint
  router.get('/profile', verifyToken, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', req.user.id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.status(200).json({ user: data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });

  return router;
};

export default userRoutes;
