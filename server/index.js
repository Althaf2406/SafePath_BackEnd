require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware agar Express bisa membaca JSON dari request body
app.use(express.json());

// Inisialisasi Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// CONTOH ROUTES (CRUD)
// ==========================================

// 1. Ambil Semua Data (READ)
app.get('/api/users', async (req, res) => {
  // Ganti 'users' dengan nama tabel yang kamu buat di Supabase
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Data berhasil diambil", data });
});

// 2. Tambah Data Baru (CREATE)
app.post('/api/users', async (req, res) => {
  const { name, email } = req.body; // Mengambil data yang dikirim client

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email }])
    .select(); // .select() di akhir untuk mengembalikan data yang baru dibuat

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: "Data berhasil ditambahkan", data });
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`Server berjalan mulus di http://localhost:${PORT}`);
});