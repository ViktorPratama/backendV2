import express from 'express';
import { validate as isUUID } from 'uuid';
import cors from 'cors';
import nodemailer from 'nodemailer';
import multer from 'multer';

const app = express();
app.use(cors());
app.use(express.json()); // Untuk memparse request body

// Gunakan /tmp sebagai direktori writable untuk file upload
const upload = multer({ dest: '/tmp/uploads/' });

const router = express.Router();

export default (supabase) => {
  // Fungsi untuk mengirimkan email reminder
  const sendReminderEmail = async (paymentDetails, recipientEmail) => {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Gunakan variabel environment
        pass: process.env.EMAIL_PASS, // Jangan hardcode password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER, // Email pengirim
      to: recipientEmail,
      subject: `Payment Reminder for Room ${paymentDetails.rooms.room_number}`,
      text: `This is a reminder for your payment of ${paymentDetails.amount}. The due date is ${paymentDetails.due_date}. Please make the payment ASAP.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Reminder email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  router.get('/pay/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Received ID on backend:', id);

    if (!isUUID(id)) {
      return res.status(400).json({ error: 'Invalid UUID format' });
    }

    const { data, error } = await supabase
      .from('payments')
      .select('id, amount, status, due_date, rooms(room_number), users(name)')
      .eq('id', id)
      .single();

    if (error) return res.status(500).json({ error: 'Error fetching payment data' });

    res.status(200).json(data);
  });

  router.get('/payments', async (req, res) => {
    try {
      const { status } = req.query;

      const query = supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          due_date,
          rooms(room_number),
          users(name)
        `);

      if (status) {
        query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Endpoint untuk mengirimkan reminder
  router.post('/reminder/:id', async (req, res) => {
    const { id } = req.params;
    const { senderEmail } = req.body;

    if (!isUUID(id)) {
      return res.status(400).json({ error: 'Invalid Payment ID format' });
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, status, due_date, rooms(room_number)')
        .eq('id', id)
        .single();

      if (error) {
        return res.status(400).json({ error: 'Payment not found' });
      }

      if (data.status !== 'unpaid') {
        return res.status(400).json({ error: 'Payment is already completed or invalid status' });
      }

      const recipientEmail = senderEmail || process.env.EMAIL_USER;

      await sendReminderEmail(data, recipientEmail);

      res.status(200).json({ message: 'Reminder sent successfully' });
    } catch (error) {
      console.error('Error sending reminder:', error);
      res.status(500).json({ error: 'Failed to send reminder' });
    }
  });

  // Endpoint untuk mengunggah bukti pembayaran
  router.post('/upload-proof', upload.single('proof'), async (req, res) => {
    try {
      const { paymentId } = req.body;
      if (!paymentId || !req.file) {
        return res.status(400).json({ error: 'Payment ID and proof file are required' });
      }

      const filePath = req.file.path;
      const { data, error } = await supabase
        .from('payment_proofs')
        .insert([{ payment_id: paymentId, file_path: filePath }]);

      if (error) {
        return res.status(500).json({ error: 'Error saving payment proof' });
      }

      res.status(200).json({ message: 'Proof uploaded successfully', filePath });
    } catch (error) {
      res.status(500).json({ error: 'Error uploading proof' });
    }
  });

  // Endpoint untuk memproses pembayaran
  router.post('/payments', async (req, res) => {
    const { userId, roomId, amount, status, due_date } = req.body;

    if (!userId || !roomId || !amount || !status || !due_date) {
      return res.status(400).json({ error: 'All fields are required: userId, roomId, amount, status, and due_date' });
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([
          {
            user_id: userId,
            room_id: roomId,
            amount: amount,
            status: status,
            due_date: due_date,
          },
        ]);

      if (error) {
        return res.status(500).json({ error: 'Error inserting payment data' });
      }

      res.status(201).json({ message: 'Payment added successfully', payment: data });
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ error: 'Failed to add payment' });
    }
  });

  return router;
};
