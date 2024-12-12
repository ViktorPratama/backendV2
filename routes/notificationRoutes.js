import express from 'express';

const notificationRoutes = (supabase) => {
  const router = express.Router();

  // Get notifications for a user
  router.get('/notifications', async (req, res) => {
    const { userId } = req.query;  // userId bisa didapatkan dari token JWT

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
      }

      res.status(200).json(data);
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Server error.' });
    }
  });

  return router;
};

export default notificationRoutes;
    