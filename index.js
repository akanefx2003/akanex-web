import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import apiRoutes from './routes/api.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || '2.0.0',
    uptime: process.uptime()
  });
});

// SPA fallback - rediriger toutes les routes non-API vers index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Créer les dossiers nécessaires
fs.ensureDirSync('./sessions');

app.listen(PORT, () => {
  console.log(`
╭━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅━╮
┃
┃  🚀 AKANE-MD V2 Web Server
┃
┃  📡 Port: ${PORT}
┃  🌐 URL: http://localhost:${PORT}
┃  📦 Version: ${process.env.VERSION || '2.0.0'}
┃
┃  ✅ Server is running!
┃
╰━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅━╯
  `);
});

export default app;