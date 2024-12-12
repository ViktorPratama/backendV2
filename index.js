import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import userRoutes from './routes/userRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import roomsRoutes from './routes/roomsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();
const app = express();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
console.log('Supabase initialized:', supabase);

app.use(cors({
  origin: 'https://rantaucash.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Default Route
app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

// Handle favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204));

// API Routes
app.use('/api/users', userRoutes(supabase));
app.use('/api/payments', paymentRoutes(supabase));
app.use('/api/rooms', roomsRoutes(supabase));
app.use('/api', notificationRoutes(supabase));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

export default app;
