import express from 'express';
import fs from 'fs-extra';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configuration
const PLUGIN_API_URL = process.env.PLUGIN_API_URL || 'https://akane-plugins.vercel.app/api/plugins';
const SESSIONS_FILE = path.join(__dirname, '../sessions/pair_sessions.json');

// ============= SESSIONS =============
function getSessions() {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

// ============= STATS =============
router.get('/stats', (req, res) => {
  const sessions = getSessions();
  res.json({
    connected: sessions.length,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || '2.0.0',
    botName: process.env.BOT_NAME || 'AKANE-MD'
  });
});

// ============= SESSIONS =============
router.get('/sessions', (req, res) => {
  const sessions = getSessions();
  res.json({ sessions });
});

router.post('/sessions/add', (req, res) => {
  const { number } = req.body;
  const clean = number.replace(/[^0-9]/g, '');
  
  if (clean.length < 7) {
    return res.status(400).json({ error: 'Numéro invalide' });
  }

  let sessions = getSessions();
  if (!sessions.includes(clean)) {
    sessions.push(clean);
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  }
  
  res.json({ success: true, number: clean });
});

router.delete('/sessions/:number', (req, res) => {
  const clean = req.params.number.replace(/[^0-9]/g, '');
  let sessions = getSessions();
  sessions = sessions.filter(n => n !== clean);
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
  res.json({ success: true, number: clean });
});

// ============= PLUGINS =============
router.get('/plugins', async (req, res) => {
  try {
    const response = await axios.get(PLUGIN_API_URL, { timeout: 5000 });
    res.json(response.data);
  } catch (err) {
    // Fallback plugins locaux
    const localPlugins = [
      {
        id: '1',
        name: 'Ping',
        command: 'ping',
        description: 'Vérifier la latence du bot',
        version: '1.0.0',
        author: 'AKANE Team',
        likes: 42,
        downloads: 128,
        category: 'utils',
        icon: '🏓',
        installs: 256,
        rating: 4.5
      },
      {
        id: '2',
        name: 'Sticker',
        command: 'sticker',
        description: 'Créer des stickers à partir d\'images ou vidéos',
        version: '2.1.0',
        author: 'AKANE Team',
        likes: 87,
        downloads: 256,
        category: 'media',
        icon: '🎨',
        installs: 512,
        rating: 4.8
      },
      {
        id: '3',
        name: 'AI Chat',
        command: 'gpt',
        description: 'Discussion avec une IA avancée (GPT-4)',
        version: '3.0.0',
        author: 'AKANE Team',
        likes: 156,
        downloads: 512,
        category: 'ai',
        icon: '🧠',
        installs: 1024,
        rating: 4.9
      },
      {
        id: '4',
        name: 'TikTok Downloader',
        command: 'tiktok',
        description: 'Télécharger des vidéos TikTok sans watermark',
        version: '1.5.2',
        author: 'AKANE Team',
        likes: 234,
        downloads: 789,
        category: 'media',
        icon: '🎵',
        installs: 1536,
        rating: 4.7
      },
      {
        id: '5',
        name: 'Truth or Dare',
        command: 'tod',
        description: 'Jeu de vérité ou défi pour les groupes',
        version: '1.2.0',
        author: 'AKANE Team',
        likes: 98,
        downloads: 234,
        category: 'games',
        icon: '🎲',
        installs: 456,
        rating: 4.6
      },
      {
        id: '6',
        name: 'Anime Search',
        command: 'anime',
        description: 'Rechercher des informations sur des animes',
        version: '2.0.1',
        author: 'AKANE Team',
        likes: 167,
        downloads: 432,
        category: 'tools',
        icon: '🎭',
        installs: 789,
        rating: 4.4
      }
    ];
    res.json(localPlugins);
  }
});

router.get('/plugins/:id', async (req, res) => {
  try {
    const response = await axios.get(`${PLUGIN_API_URL}/${req.params.id}`);
    res.json(response.data);
  } catch (err) {
    res.status(404).json({ error: 'Plugin non trouvé' });
  }
});

router.post('/plugins/:id/like', async (req, res) => {
  try {
    await axios.post(`${PLUGIN_API_URL}/${req.params.id}/like`);
    res.json({ success: true });
  } catch (err) {
    // Simuler un like en local
    res.json({ success: true, message: 'Like enregistré (simulation)' });
  }
});

// ============= INFO =============
router.get('/info', (req, res) => {
  res.json({
    name: process.env.BOT_NAME || 'AKANE-MD',
    version: process.env.VERSION || '2.0.0',
    owner: process.env.OWNER || '221771202333',
    channels: {
      whatsapp: process.env.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbCrJRnGufIyytPXy606',
      github: process.env.GITHUB_LINK || 'https://github.com/akanefx2003/AKANE_MD',
      youtube: process.env.YOUTUBE_LINK || 'https://youtube.com/@akanefx-j3k9o'
    }
  });
});

export default router;