// ========== STATE ==========
const state = {
  currentTab: 'pairing',
  phoneNumber: '',
  pairingCode: null,
  isPairing: false,
  plugins: [],
  filteredPlugins: []
};

// ========== DOM REFS ==========
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ========== TABS ==========
$$('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    const tab = link.dataset.tab;
    if (!tab) return;
    
    $$('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    
    $$('.tab-content').forEach(c => c.classList.remove('active'));
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.add('active');
    
    state.currentTab = tab;
    
    if (tab === 'plugins') loadPlugins();
    if (tab === 'stats') loadStats();
  });
});

// ========== PAIRING ==========
async function requestPairing() {
  if (state.isPairing) return;
  
  const input = document.getElementById('phoneInput');
  const number = input.value.replace(/[^0-9]/g, '');
  
  if (number.length < 7) {
    showStatus('error', '❌ Numéro invalide', 'Veuillez entrer un numéro valide');
    return;
  }
  
  state.phoneNumber = number;
  state.isPairing = true;
  
  const btn = document.getElementById('pairBtn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'En cours...';
  btn.querySelector('.btn-spinner').style.display = 'inline-block';
  
  // Afficher le status
  showStatus('loading', '⏳ Connexion en cours...', 'Établissement de la connexion sécurisée...');
  
  try {
    const response = await fetch('/api/sessions/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number })
    });
    
    const data = await response.json();
    
    if (data.error) {
      showStatus('error', '❌ Erreur', data.error);
      resetPairing();
      return;
    }
    
    // Simuler une génération de code (à remplacer par l'appel réel au bot)
    await simulatePairing(number);
    
  } catch (err) {
    showStatus('error', '❌ Erreur', err.message || 'Erreur de connexion');
    resetPairing();
  }
}

function simulatePairing(number) {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 8 + 2;
      if (progress > 100) progress = 100;
      
      document.getElementById('progressFill').style.width = progress + '%';
      document.getElementById('progressText').textContent = Math.round(progress) + '%';
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Générer un code aléatoire
        const code = String(Math.floor(100000 + Math.random() * 900000));
        state.pairingCode = code;
        
        document.getElementById('statusContainer').style.display = 'none';
        document.getElementById('codeDisplay').style.display = 'block';
        document.getElementById('pairingCode').textContent = code;
        
        // Mettre à jour le statut
        document.getElementById('statusText').textContent = '✅ Code généré';
        document.getElementById('statusDot').className = 'pulse-dot';
        
        // Marquer comme connecté après 5 secondes (simulation)
        setTimeout(() => {
          document.getElementById('codeDisplay').style.display = 'none';
          document.getElementById('connectedDisplay').style.display = 'block';
          document.getElementById('connectedNumber').textContent = `+221${number}`;
          document.getElementById('statusText').textContent = '✅ Connecté';
          document.getElementById('statusDot').className = 'pulse-dot';
          
          // Mettre à jour le compteur
          updateConnectedCount();
        }, 5000);
        
        resetPairing();
        resolve();
      }
    }, 200);
  });
}

function showStatus(type, title, message) {
  const container = document.getElementById('statusContainer');
  container.style.display = 'block';
  
  document.getElementById('statusIcon').textContent = 
    type === 'loading' ? '⏳' : 
    type === 'error' ? '❌' : '✅';
  
  document.getElementById('statusMessage').textContent = title;
  
  // Mettre à jour le statut dans la barre
  document.getElementById('statusText').textContent = 
    type === 'loading' ? '⏳ En cours...' :
    type === 'error' ? '❌ Erreur' : '✅ Terminé';
  
  document.getElementById('statusDot').className = 
    type === 'loading' ? 'pulse-dot loading' :
    type === 'error' ? 'pulse-dot error' : 'pulse-dot';
}

function resetPairing() {
  state.isPairing = false;
  const btn = document.getElementById('pairBtn');
  btn.disabled = false;
  btn.querySelector('.btn-text').textContent = 'Get Code';
  btn.querySelector('.btn-spinner').style.display = 'none';
}

function copyCode() {
  const code = document.getElementById('pairingCode').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.querySelector('.copy-btn');
    const originalText = btn.textContent;
    btn.textContent = '✅ Copié !';
    setTimeout(() => {
      btn.textContent = originalText;
    }, 2000);
  });
}

// ========== CONNECTED COUNT ==========
async function updateConnectedCount() {
  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    document.getElementById('connectedCount').textContent = data.connected || 0;
  } catch (err) {
    console.error('Erreur stats:', err);
  }
}

// ========== PLUGINS ==========
async function loadPlugins() {
  try {
    const response = await fetch('/api/plugins');
    const data = await response.json();
    state.plugins = data;
    state.filteredPlugins = data;
    renderPlugins(data);
  } catch (err) {
    console.error('Erreur plugins:', err);
    document.getElementById('pluginGrid').innerHTML = `
      <div class="plugin-error">
        <p>❌ Impossible de charger les plugins</p>
        <p style="font-size:12px;color:var(--text-dim)">${err.message}</p>
      </div>
    `;
  }
}

function renderPlugins(plugins) {
  const grid = document.getElementById('pluginGrid');
  
  if (!plugins || plugins.length === 0) {
    grid.innerHTML = `
      <div class="plugin-empty">
        <p>📦 Aucun plugin disponible</p>
        <p style="font-size:12px;color:var(--text-dim)">Reviens plus tard !</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = plugins.map(p => `
    <div class="plugin-card" data-id="${p.id || p.name}">
      <div class="header">
        <div class="name">${p.icon || '📦'} ${p.name}</div>
        <span class="category">${p.category || 'uncategorized'}</span>
      </div>
      <div class="command">.${p.command || p.name.toLowerCase()}</div>
      <div class="description">${p.description || 'Aucune description'}</div>
      <div class="meta">
        <div class="author">
          👤 <span>${p.author || 'Anonyme'}</span>
        </div>
        <div class="likes" onclick="likePlugin('${p.id || p.name}')">
          <span class="heart">❤️</span>
          <span class="count">${p.likes || 0}</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:11px;color:var(--text-dim)">
        <span>📥 ${p.installs || p.downloads || 0} installs</span>
        <span>⭐ ${p.rating || 'N/A'}</span>
      </div>
    </div>
  `).join('');
  
  // Mettre à jour les stats
  document.getElementById('statPlugins').textContent = plugins.length;
}

async function likePlugin(id) {
  try {
    const response = await fetch(`/api/plugins/${id}/like`, { method: 'POST' });
    const data = await response.json();
    if (data.success) {
      // Recharger les plugins
      loadPlugins();
    }
  } catch (err) {
    console.error('Erreur like:', err);
  }
}

// ========== PLUGIN SEARCH ==========
document.getElementById('pluginSearch')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  filterPlugins(query);
});

document.getElementById('pluginFilter')?.addEventListener('change', (e) => {
  filterPlugins(document.getElementById('pluginSearch').value.toLowerCase());
});

function filterPlugins(query) {
  const category = document.getElementById('pluginFilter').value;
  
  state.filteredPlugins = state.plugins.filter(p => {
    const matchName = p.name.toLowerCase().includes(query);
    const matchDesc = p.description?.toLowerCase().includes(query) || false;
    const matchAuthor = p.author?.toLowerCase().includes(query) || false;
    const matchCommand = p.command?.toLowerCase().includes(query) || false;
    const matchCategory = category === 'all' || p.category === category;
    
    return (matchName || matchDesc || matchAuthor || matchCommand) && matchCategory;
  });
  
  renderPlugins(state.filteredPlugins);
}

// ========== STATS ==========
async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    
    document.getElementById('statBots').textContent = data.connected || 0;
    
    const uptime = data.uptime || 0;
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    document.getElementById('statUptime').textContent = 
      days > 0 ? `${days}j ${hours}h ${minutes}m` :
      `${hours}h ${minutes}m ${seconds}s`;
    
    const ram = data.memory?.heapUsed || 0;
    document.getElementById('statRam').textContent = 
      Math.round(ram / 1024 / 1024) + 'MB';
    
    // Système info
    const info = await fetch('/api/info');
    const infoData = await info.json();
    
    document.getElementById('systemInfo').textContent = `
📌 BOT: ${infoData.name || 'AKANE-MD'}
📦 VERSION: ${infoData.version || '2.0.0'}
👑 OWNER: ${infoData.owner || 'N/A'}
🤖 BOTS: ${data.connected || 0}
⏱ UPTIME: ${document.getElementById('statUptime').textContent}
💾 RAM: ${document.getElementById('statRam').textContent}
📡 STATUS: ✅ Online
🕐 TIMESTAMP: ${new Date(data.timestamp).toLocaleString()}
    `.trim();
    
  } catch (err) {
    console.error('Erreur stats:', err);
  }
}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  updateConnectedCount();
  setInterval(updateConnectedCount, 10000);
  
  // Charger les plugins si l'onglet est actif par défaut
  setTimeout(() => {
    if (document.getElementById('tab-plugins').classList.contains('active')) {
      loadPlugins();
    }
    if (document.getElementById('tab-stats').classList.contains('active')) {
      loadStats();
    }
  }, 500);
});

// ========== ENTER KEY ==========
document.getElementById('phoneInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    requestPairing();
  }
});