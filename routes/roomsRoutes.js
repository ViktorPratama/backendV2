import express from 'express';

const roomsRoutes = (supabase) => {
    const router = express.Router();
  
    // Endpoint untuk mendapatkan data kamar dengan nama pemilik
    router.get('/kamar', async (req, res) => {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select(`
            id,
            room_number,
            price,
            owner_id,
            users:users(name) // Relasi tabel users dengan alias 'users'
          `);
  
        if (error) {
          console.error('Error fetching rooms:', error);
          return res.status(500).json({ error: 'Gagal mengambil data kamar.' });
        }
  
        res.status(200).json(data);
      } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Terjadi kesalahan di server.' });
      }
    });
  
    return router;
  };
  
  export default roomsRoutes;