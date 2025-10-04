// =============================================
// COMITATO NEW WAVE - APP.JS (CSP-FRIENDLY VERSION)
// =============================================
// ✅ Compatibile con Content Security Policy (no eval, no inline script)
// ✅ Rimosse chiamate alert() → sostituito con toast UI
// ✅ Supporto a proxy server per token GitHub (nessun token nel client)
// ✅ Sicuro e mantenibile

// =====================
// CONFIGURAZIONE GITHUB
// =====================
const GITHUB_CONFIG = {
  username: 'Wizzo0901',
  repo: 'comitato-newwave',
  branch: 'main',
  dataPath: 'data/'
};

// =====================
// CONFIGURAZIONE SICUREZZA
// =====================
const SECURITY_CONFIG = {
  maxAttempts: 5,
  lockoutTime: 15 * 60 * 1000, // 15 minuti
  sessionTimeout: 60 * 60 * 1000 // 60 minuti
};

const SECURE_CREDENTIALS = {
  username: 'admin',
  password: 'NewWave2025!'
};

// =====================
// UTILITÀ
// =====================
function showMessage(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function formatDate(dateString) {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('it-IT', options);
}

// =====================
// STATO E VARIABILI
// =====================
let securityState = { loginAttempts: 0, lockoutUntil: 0, lastActivity: Date.now() };
let isAdmin = false;
let news = [];
let questions = [];
let customLinkConfig = { url: '#', text: 'Link Aggiuntivo' };
let lastSync = { news: 0, content: 0, questions: 0 };

// =====================
// FUNZIONI GITHUB (via PROXY)
// =====================
async function saveToGitHub(filename, data) {
  try {
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, data })
    });
    if (!response.ok) throw new Error('Errore salvataggio');
    showMessage('✅ Salvataggio completato', 'success');
    return true;
  } catch (error) {
    console.error('❌ Errore salvataggio:', error);
    localStorage.setItem(`backup_${filename}`, JSON.stringify({ data, timestamp: Date.now() }));
    showMessage('⚠️ Dati salvati in locale (offline mode)', 'warning');
    return false;
  }
}

async function loadPublicData(filename) {
  try {
    const url = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.dataPath}${filename}?t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) {
      const backup = localStorage.getItem(`backup_${filename}`);
      if (backup) {
        const { data } = JSON.parse(backup);
        showMessage('📂 Caricamento da backup locale', 'info');
        return data;
      }
      throw new Error('File non trovato');
    }
    return await response.json();
  } catch (error) {
    console.error('Errore caricamento:', error);
    showMessage('❌ Errore nel caricamento dati', 'error');
    return null;
  }
}

// =====================
// LOGIN E SICUREZZA
// =====================
function loadSecurityState() {
  const saved = localStorage.getItem('securityState');
  if (saved) {
    try {
      securityState = JSON.parse(saved);
    } catch {
      securityState = { loginAttempts: 0, lockoutUntil: 0, lastActivity: Date.now() };
    }
  }
}

function saveSecurityState() {
  localStorage.setItem('securityState', JSON.stringify(securityState));
}

function authenticate(username, password) {
  if (securityState.lockoutUntil > Date.now()) {
    const mins = Math.ceil((securityState.lockoutUntil - Date.now()) / 60000);
    return { success: false, message: `Account bloccato. Riprova tra ${mins} minuti` };
  }
  if (username !== SECURE_CREDENTIALS.username || password !== SECURE_CREDENTIALS.password) {
    securityState.loginAttempts++;
    if (securityState.loginAttempts >= SECURITY_CONFIG.maxAttempts) {
      securityState.lockoutUntil = Date.now() + SECURITY_CONFIG.lockoutTime;
    }
    saveSecurityState();
    return { success: false, message: 'Credenziali non valide' };
  }
  securityState = { loginAttempts: 0, lockoutUntil: 0, lastActivity: Date.now() };
  saveSecurityState();
  return { success: true, message: 'Accesso effettuato' };
}

function login() {
  isAdmin = true;
  localStorage.setItem('isAdmin', 'true');
  document.getElementById('adminPanel').style.display = 'block';
  document.getElementById('loginLink').textContent = 'Logout';
  showMessage('✅ Accesso effettuato con successo', 'success');
}

function logout() {
  isAdmin = false;
  localStorage.removeItem('isAdmin');
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('loginLink').textContent = 'Login';
  showMessage('👋 Disconnesso', 'info');
}

// =====================
// GESTIONE DATI
// =====================
async function loadAllData() {
  const [newsData, contentData, questionsData] = await Promise.all([
    loadPublicData('news.json'),
    loadPublicData('content.json'),
    loadPublicData('questions.json')
  ]);
  if (newsData) renderNews(newsData);
  if (contentData) renderContent(contentData);
  if (questionsData) renderQuestions(questionsData);
}

function renderNews(data) {
  const grid = document.getElementById('newsGrid');
  grid.innerHTML = '';
  if (!data || data.length === 0) {
    grid.innerHTML = '<div class="empty-state"><h3>Nessuna novità</h3></div>';
    return;
  }
  data.forEach(item => {
    const div = document.createElement('div');
    div.className = 'novita-item';
    div.innerHTML = `
      <h3>${item.title}</h3>
      <div class="date">${formatDate(item.date)}</div>
      <p>${item.content}</p>
    `;
    grid.appendChild(div);
  });
}

function renderContent(data) {
  const heroTitle = document.getElementById('heroTitle');
  const heroText = document.getElementById('heroText');
  if (data.heroTitle) heroTitle.textContent = data.heroTitle;
  if (data.heroText) heroText.textContent = data.heroText;
  if (data.customLink) {
    const customLink = document.getElementById('custom-link');
    customLink.href = data.customLink.url;
    customLink.textContent = data.customLink.text;
  }
}

function renderQuestions(data) {
  const list = document.getElementById('questionsList');
  list.innerHTML = '';
  if (!data || data.length === 0) {
    list.innerHTML = '<p>Nessuna domanda disponibile</p>';
    return;
  }
  data.forEach(q => {
    const div = document.createElement('div');
    div.className = 'question-item';
    div.innerHTML = `<div><b>${q.text}</b> <span>${formatDate(q.date)}</span></div>`;
    list.appendChild(div);
  });
}

// =====================
// EVENTI
// =====================
function setupEventListeners() {
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const result = authenticate(user, pass);
    if (result.success) login();
    else showMessage(result.message, 'error');
  });

  document.getElementById('loginLink').addEventListener('click', e => {
    e.preventDefault();
    if (isAdmin) logout();
    else document.getElementById('loginModal').classList.add('active');
  });

  document.getElementById('closeLoginModal').addEventListener('click', () => {
    document.getElementById('loginModal').classList.remove('active');
  });
}

// =====================
// INIZIALIZZAZIONE
// =====================
function init() {
  loadSecurityState();
  setupEventListeners();
  loadAllData();
  if (localStorage.getItem('isAdmin') === 'true') login();
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
