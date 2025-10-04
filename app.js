// ==============================
// CONFIGURAZIONE GITHUB
// ==============================

const GITHUB_CONFIG = {
    username: 'Wizzo0901',
    repo: 'comitato-newwave',
    branch: 'main',
    token: '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',
    dataPath: 'data/'
};

// ==============================
// CONFIGURAZIONE SICUREZZA
// ==============================
const SECURITY_CONFIG = {
    maxAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 60 * 60 * 1000, // 60 minutes
};

const SECURE_CREDENTIALS = {
    username: "admin",
    password: "NewWave2025!"
};

// ==============================
// FUNZIONE BASE64 SICURA - SENZA eval
// ==============================
function safeBase64(str) {
    // Approccio semplice e sicuro
    let binary = '';
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        // Solo caratteri ASCII sicuri
        if (code < 128) {
            binary += String.fromCharCode(code);
        }
    }
    return btoa(binary);
}

// ==============================
// VARIABILI GLOBALI
// ==============================
let securityState = {
    loginAttempts: 0,
    lockoutUntil: 0,
    lastActivity: Date.now()
};

let isAdmin = false;
let currentEditingElement = null;
let currentMediaType = 'none';
let selectedImage = null;
let selectedVideo = null;
let isConnected = false;
let lastSync = { news: 0, content: 0, questions: 0 };
let syncInterval = null;

// Dati dell'applicazione
let customLinkConfig = { url: "#", text: "Link Aggiuntivo" };
let news = [];
let questions = [];

// ==============================
// ELEMENTI DOM
// ==============================
const loginModal = document.getElementById('loginModal');
const questionModal = document.getElementById('questionModal');
const editContentModal = document.getElementById('editContentModal');
const addNewsModal = document.getElementById('addNewsModal');
const editLinkModal = document.getElementById('editLinkModal');
const loginLink = document.getElementById('loginLink');
const closeLoginModal = document.getElementById('closeLoginModal');
const closeQuestionModal = document.getElementById('closeQuestionModal');
const closeEditModal = document.getElementById('closeEditModal');
const closeAddNewsModal = document.getElementById('closeAddNewsModal');
const closeLinkModal = document.getElementById('closeLinkModal');
const loginForm = document.getElementById('loginForm');
const questionForm = document.getElementById('questionForm');
const editContentForm = document.getElementById('editContentForm');
const addNewsForm = document.getElementById('addNewsForm');
const editLinkForm = document.getElementById('editLinkForm');
const adminPanel = document.getElementById('adminPanel');
const askQuestionBtn = document.getElementById('askQuestionBtn');
const openQuestionModal = document.getElementById('openQuestionModal');
const askQuestionLink = document.getElementById('askQuestionLink');
const editHomeBtn = document.getElementById('editHomeBtn');
const addNewsBtn = document.getElementById('addNewsBtn');
const viewQuestionsBtn = document.getElementById('viewQuestionsBtn');
const editLinkBtn = document.getElementById('editLinkBtn');
const refreshNowBtn = document.getElementById('refreshNowBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminQuestionsView = document.getElementById('adminQuestionsView');
const questionsList = document.getElementById('questionsList');
const newsGrid = document.getElementById('newsGrid');
const heroTitle = document.getElementById('heroTitle');
const heroText = document.getElementById('heroText');
const customLink = document.getElementById('custom-link');
const customLinkText = document.getElementById('customLinkText');
const loginAttempts = document.getElementById('loginAttempts');
const attemptsCount = document.getElementById('attemptsCount');
const loginButton = document.getElementById('loginButton');
const connectionStatus = document.getElementById('connectionStatus');
const syncIndicator = document.getElementById('syncIndicator');

// Media elements
const mediaTypeBtns = document.querySelectorAll('.media-type-btn');
const imageUpload = document.getElementById('imageUpload');
const videoUpload = document.getElementById('videoUpload');
const newsImage = document.getElementById('newsImage');
const newsVideo = document.getElementById('newsVideo');
const imagePreview = document.getElementById('imagePreview');
const videoPreview = document.getElementById('videoPreview');
const previewImage = document.getElementById('previewImage');
const previewVideo = document.getElementById('previewVideo');

// ==============================
// FUNZIONI GITHUB - VERSIONE SICURA
// ==============================

// Salva dati su GitHub - VERSIONE SICURA
async function saveToGitHub(filename, data) {
    console.log('💾 Salvataggio su GitHub:', filename);
    
    try {
        const jsonString = JSON.stringify(data, null, 2);
        const content = safeBase64(jsonString);
        
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}${filename}`;
        
        // Verifica se il file esiste
        let sha = null;
        try {
            const existing = await fetch(url, {
                headers: {
                    'Authorization': `token ${GITHUB_CONFIG.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (existing.ok) {
                const existingData = await existing.json();
                sha = existingData.sha;
            }
        } catch (e) {
            console.log('Nuovo file');
        }
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Aggiornamento ${filename}`,
                content: content,
                branch: GITHUB_CONFIG.branch,
                sha: sha
            })
        });
        
        if (!response.ok) {
            throw new Error(`Errore GitHub: ${response.status}`);
        }
        
        console.log('✅ Salvataggio completato');
        return true;
        
    } catch (error) {
        console.error('❌ Errore salvataggio:', error);
        
        // Salva localmente come fallback
        localStorage.setItem(`backup_${filename}`, JSON.stringify({
            data: data,
            timestamp: Date.now()
        }));
        
        return false;
    }
}

// Carica dati pubblici (senza token)
async function loadPublicData(filename) {
    try {
        const url = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.dataPath}${filename}?t=${Date.now()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            // Prova a caricare dal backup locale
            const backup = localStorage.getItem(`backup_${filename}`);
            if (backup) {
                const backupData = JSON.parse(backup);
                console.log('📂 Caricamento da backup locale');
                return backupData.data;
            }
            throw new Error('File non trovato');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Errore caricamento:', error);
        return null;
    }
}

// ==============================
// SINCRONIZZAZIONE
// ==============================

function startSyncPolling() {
    syncInterval = setInterval(async () => {
        await checkForUpdates();
    }, 10000);
    
    setTimeout(async () => {
        await checkForUpdates();
    }, 3000);
}

async function checkForUpdates() {
    console.log('🔄 checkForUpdates');
    
    try {
        const commitsUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/commits?path=${GITHUB_CONFIG.dataPath}&per_page=1`;
        
        const response = await fetch(commitsUrl);
        if (response.ok) {
            const commits = await response.json();
            if (commits.length > 0) {
                const latestCommit = commits[0];
                const commitTime = new Date(latestCommit.commit.committer.date).getTime();
                
                if (commitTime > lastSync.news) {
                    console.log('🎯 Trovati aggiornamenti! Ricarico dati...');
                    showSyncIndicator();
                    await loadAllData();
                    lastSync.news = commitTime;
                    setTimeout(hideSyncIndicator, 2000);
                }
            }
        }
    } catch (error) {
        console.error('Errore nel controllo aggiornamenti:', error);
    }
}

// ==============================
// FUNZIONI PRINCIPALI
// ==============================

async function loadAllData() {
    console.log('🔄 Caricamento tutti i dati...');
    
    try {
        const [newsData, contentData, questionsData] = await Promise.all([
            loadPublicData('news.json'),
            loadPublicData('content.json'),
            loadPublicData('questions.json')
        ]);
        
        if (newsData) {
            news = newsData;
            renderNews();
        }
        
        if (contentData) {
            if (contentData.heroTitle) heroTitle.textContent = contentData.heroTitle;
            if (contentData.heroText) heroText.textContent = contentData.heroText;
            if (contentData.customLink) {
                customLinkConfig = contentData.customLink;
                updateCustomLink();
            }
        }
        
        if (questionsData) {
            questions = questionsData;
            if (isAdmin) {
                renderQuestions();
            }
        }
        
        updateConnectionStatus(true);
        console.log('✅ Tutti i dati caricati');
    } catch (error) {
        console.error('❌ Errore caricamento dati:', error);
        updateConnectionStatus(false);
    }
}

async function addNews(title, date, content, mediaType, mediaUrl) {
    const newNews = {
        id: Date.now(),
        title,
        date,
        content,
        mediaType,
        mediaUrl,
        createdAt: new Date().toISOString()
    };

    // Carica news esistenti
    const existingNews = await loadPublicData('news.json') || [];
    const updatedNews = [newNews, ...existingNews];
    
    // Salva su GitHub
    await saveToGitHub('news.json', updatedNews);
    
    // Aggiorna localmente
    news = updatedNews;
    renderNews();
    
    showSyncIndicator();
    setTimeout(hideSyncIndicator, 2000);
}

async function addQuestion(text) {
    console.log('❓ Aggiunta domanda:', text);
    
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + 30);
    
    const newQuestion = {
        id: Date.now(),
        text,
        date: now.toISOString().split('T')[0],
        expires: expires.toISOString().split('T')[0]
    };

    const existingQuestions = await loadPublicData('questions.json') || [];
    const updatedQuestions = [...existingQuestions, newQuestion];
    
    console.log('💾 Salvataggio domanda su GitHub...');
    const saveResult = await saveToGitHub('questions.json', updatedQuestions);
    
    if (saveResult) {
        console.log('✅ Domanda salvata con successo!');
        questions = updatedQuestions;
        if (isAdmin) {
            renderQuestions();
        }
    } else {
        console.log('⚠️ Domanda salvata localmente (fallback)');
    }
    
    showSyncIndicator();
    setTimeout(hideSyncIndicator, 2000);
}

async function updateContent(updates) {
    const existingContent = await loadPublicData('content.json') || {};
    const updatedContent = { ...existingContent, ...updates };
    
    await saveToGitHub('content.json', updatedContent);
    
    // Aggiorna UI
    if (updates.heroTitle) heroTitle.textContent = updates.heroTitle;
    if (updates.heroText) heroText.textContent = updates.heroText;
    if (updates.customLink) {
        customLinkConfig = updates.customLink;
        updateCustomLink();
    }
    
    showSyncIndicator();
    setTimeout(hideSyncIndicator, 2000);
}

async function deleteNews(id) {
    const updatedNews = news.filter(n => n.id !== id);
    await saveToGitHub('news.json', updatedNews);
    news = updatedNews;
    renderNews();
    showSyncIndicator();
    setTimeout(hideSyncIndicator, 2000);
}

async function deleteQuestion(id) {
    const updatedQuestions = questions.filter(q => q.id !== id);
    await saveToGitHub('questions.json', updatedQuestions);
    questions = updatedQuestions;
    renderQuestions();
    showSyncIndicator();
    setTimeout(hideSyncIndicator, 2000);
}

// ==============================
// FUNZIONI UI
// ==============================

function renderNews() {
    newsGrid.innerHTML = '';
    
    if (news.length === 0) {
        newsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-newspaper"></i>
                <h3>Nessuna novità al momento</h3>
                <p>Torna presto per aggiornamenti!</p>
            </div>
        `;
        return;
    }
    
    const sortedNews = [...news].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedNews.forEach(item => {
        const newsItem = document.createElement('div');
        newsItem.className = 'novita-item';
        
        let actionsHTML = '';
        if (isAdmin) {
            actionsHTML = `
                <div class="novita-actions">
                    <button class="btn btn-danger delete-news-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }
        
        let mediaHTML = '';
        if (item.mediaType === 'image' && item.mediaUrl) {
            mediaHTML = `
                <div class="media-container">
                    <img src="${item.mediaUrl}" alt="${item.title}">
                </div>
            `;
        } else if (item.mediaType === 'video' && item.mediaUrl) {
            mediaHTML = `
                <div class="media-container">
                    <video controls>
                        <source src="${item.mediaUrl}" type="video/mp4">
                        Il tuo browser non supporta la riproduzione di video.
                    </video>
                </div>
            `;
        }
        
        newsItem.innerHTML = `
            ${actionsHTML}
            <h3>${item.title}</h3>
            <div class="date">
                <i class="far fa-calendar"></i> ${formatDate(item.date)}
            </div>
            ${mediaHTML}
            <p>${item.content}</p>
        `;
        newsGrid.appendChild(newsItem);
    });

    // Aggiungi event listeners per i pulsanti di eliminazione
    if (isAdmin) {
        document.querySelectorAll('.delete-news-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (confirm('Sei sicuro di voler eliminare questa notizia?')) {
                    deleteNews(id);
                }
            });
        });
    }
}

function renderQuestions() {
    questionsList.innerHTML = '';
    
    if (questions.length === 0) {
        questionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-question-circle"></i>
                <h3>Nessuna domanda ricevuta</h3>
                <p>Non ci sono ancora domande da visualizzare.</p>
            </div>
        `;
        return;
    }
    
    questions.forEach(question => {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        questionItem.innerHTML = `
            <div class="question-header">
                <div>
                    <div class="question-text">${question.text}</div>
                    <div class="question-date">Ricevuta il: ${formatDate(question.date)} - Scade il: ${formatDate(question.expires)}</div>
                </div>
                <div class="question-actions">
                    <button class="btn btn-danger delete-question-btn" data-id="${question.id}">Elimina</button>
                </div>
            </div>
        `;
        questionsList.appendChild(questionItem);
    });

    // Aggiungi event listeners per i pulsanti di eliminazione
    document.querySelectorAll('.delete-question-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            if (confirm('Sei sicuro di voler eliminare questa domanda?')) {
                deleteQuestion(id);
            }
        });
    });
}

function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
}

function updateCustomLink() {
    customLink.href = customLinkConfig.url;
    customLinkText.textContent = customLinkConfig.text;
}

function updateConnectionStatus(connected) {
    isConnected = connected;
    
    if (connected) {
        connectionStatus.className = 'connection-status connected';
        connectionStatus.innerHTML = '<i class="fas fa-wifi"></i> <span>Connesso</span>';
    } else {
        connectionStatus.className = 'connection-status disconnected';
        connectionStatus.innerHTML = '<i class="fas fa-wifi-slash"></i> <span>Disconnesso</span>';
    }
}

function showSyncIndicator() {
    syncIndicator.style.display = 'flex';
}

function hideSyncIndicator() {
    syncIndicator.style.display = 'none';
}

// ==============================
// SICUREZZA E LOGIN
// ==============================

function loadSecurityState() {
    const savedState = localStorage.getItem('securityState');
    if (savedState) {
        try {
            securityState = JSON.parse(savedState);
            if (securityState.lockoutUntil > 0 && Date.now() > securityState.lockoutUntil) {
                securityState.loginAttempts = 0;
                securityState.lockoutUntil = 0;
                saveSecurityState();
            }
        } catch (e) {
            securityState = { loginAttempts: 0, lockoutUntil: 0, lastActivity: Date.now() };
        }
    }
}

function saveSecurityState() {
    localStorage.setItem('securityState', JSON.stringify(securityState));
}

function updateSecurityUI() {
    const remainingAttempts = SECURITY_CONFIG.maxAttempts - securityState.loginAttempts;
    attemptsCount.textContent = remainingAttempts;
    
    if (securityState.lockoutUntil > 0) {
        const timeLeft = Math.ceil((securityState.lockoutUntil - Date.now()) / 60000);
        loginAttempts.innerHTML = `Account bloccato. Riprova tra ${timeLeft} minuti`;
        loginButton.disabled = true;
        loginButton.innerHTML = '<i class="fas fa-lock"></i> Accesso Bloccato';
    } else if (remainingAttempts <= 0) {
        securityState.lockoutUntil = Date.now() + SECURITY_CONFIG.lockoutTime;
        saveSecurityState();
        updateSecurityUI();
    }
}

function authenticate(username, password) {
    if (securityState.lockoutUntil > 0 && Date.now() < securityState.lockoutUntil) {
        return { success: false, message: `Account bloccato. Riprova tra ${Math.ceil((securityState.lockoutUntil - Date.now()) / 60000)} minuti` };
    }
    
    if (username !== SECURE_CREDENTIALS.username || password !== SECURE_CREDENTIALS.password) {
        securityState.loginAttempts++;
        saveSecurityState();
        updateSecurityUI();
        return { success: false, message: 'Credenziali non valide' };
    }
    
    securityState.loginAttempts = 0;
    securityState.lockoutUntil = 0;
    securityState.lastActivity = Date.now();
    saveSecurityState();
    
    return { success: true, message: 'Accesso effettuato con successo' };
}

function login() {
    isAdmin = true;
    localStorage.setItem('isAdmin', 'true');
    adminPanel.style.display = 'block';
    loginLink.textContent = 'Logout';
    loginModal.classList.remove('active');
    renderNews();
    securityState.lastActivity = Date.now();
    saveSecurityState();
}

function logout() {
    isAdmin = false;
    localStorage.removeItem('isAdmin');
    adminPanel.style.display = 'none';
    adminQuestionsView.style.display = 'none';
    loginLink.textContent = 'Login';
    renderNews();
    securityState.lastActivity = 0;
    saveSecurityState();
}

function checkLoginStatus() {
    const savedLogin = localStorage.getItem('isAdmin');
    if (savedLogin === 'true') {
        isAdmin = true;
        adminPanel.style.display = 'block';
        loginLink.textContent = 'Logout';
        securityState.lastActivity = Date.now();
        saveSecurityState();
    }
}

// ==============================
// MEDIA HANDLERS
// ==============================

function setupMediaHandlers() {
    mediaTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            selectMediaType(type);
        });
    });
    
    imageUpload.addEventListener('click', function() {
        newsImage.click();
    });
    
    newsImage.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('L\'immagine è troppo grande. Dimensione massima: 5MB');
                this.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                imagePreview.style.display = 'block';
                selectedImage = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    videoUpload.addEventListener('click', function() {
        newsVideo.click();
    });
    
    newsVideo.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 100 * 1024 * 1024) {
                alert('Il video è troppo grande. Dimensione massima: 100MB');
                this.value = '';
                return;
            }
            
            const url = URL.createObjectURL(file);
            previewVideo.src = url;
            videoPreview.style.display = 'block';
            selectedVideo = url;
        }
    });
}

function selectMediaType(type) {
    currentMediaType = type;
    
    mediaTypeBtns.forEach(btn => {
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    imageUpload.style.display = type === 'image' ? 'block' : 'none';
    videoUpload.style.display = type === 'video' ? 'block' : 'none';
    
    if (type !== 'image') {
        imagePreview.style.display = 'none';
        previewImage.src = '';
        newsImage.value = '';
        selectedImage = null;
    }
    
    if (type !== 'video') {
        videoPreview.style.display = 'none';
        previewVideo.src = '';
        newsVideo.value = '';
        selectedVideo = null;
    }
}

// ==============================
// EVENT LISTENERS
// ==============================

function setupEventListeners() {
    // Menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    
    menuToggle.addEventListener('click', function() {
        mainNav.classList.toggle('active');
    });
    
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('active');
        });
    });
    
    // Back to top
    const backToTop = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Modal controls
    loginLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (isAdmin) {
            logout();
        } else {
            updateSecurityUI();
            loginModal.classList.add('active');
        }
    });
    
    closeLoginModal.addEventListener('click', function() {
        loginModal.classList.remove('active');
    });
    
    closeQuestionModal.addEventListener('click', function() {
        questionModal.classList.remove('active');
    });
    
    closeEditModal.addEventListener('click', function() {
        editContentModal.classList.remove('active');
    });
    
    closeAddNewsModal.addEventListener('click', function() {
        addNewsModal.classList.remove('active');
        addNewsForm.reset();
        selectMediaType('none');
    });
    
    closeLinkModal.addEventListener('click', function() {
        editLinkModal.classList.remove('active');
    });
    
    // Open question modal
    [askQuestionBtn, openQuestionModal, askQuestionLink].forEach(element => {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            questionModal.classList.add('active');
        });
    });
    
    // Form submissions
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const authResult = authenticate(username, password);
        
        if (authResult.success) {
            login();
        } else {
            alert('Errore di autenticazione: ' + authResult.message);
        }
    });
    
    questionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const questionText = document.getElementById('questionText').value;
        
        if (questionText.trim() === '') {
            alert('Per favore, inserisci una domanda!');
            return;
        }
        
        addQuestion(questionText);
        questionForm.reset();
        questionModal.classList.remove('active');
        alert('Domanda inviata con successo!');
    });
    
    editContentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('contentTitle').value;
        const text = document.getElementById('contentText').value;
        
        if (currentEditingElement === 'heroTitle') {
            updateContent({ heroTitle: title });
        } else if (currentEditingElement === 'heroText') {
            updateContent({ heroText: text });
        }
        
        editContentModal.classList.remove('active');
        alert('Contenuto aggiornato con successo!');
    });
    
    addNewsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('newsTitle').value;
        const date = document.getElementById('newsDate').value;
        const content = document.getElementById('newsContent').value;
        
        if (!title || !date || !content) {
            alert('Per favore, compila tutti i campi obbligatori!');
            return;
        }
        
        let mediaUrl = null;
        if (currentMediaType === 'image' && selectedImage) {
            mediaUrl = selectedImage;
        } else if (currentMediaType === 'video' && selectedVideo) {
            mediaUrl = selectedVideo;
        }
        
        addNews(title, date, content, currentMediaType, mediaUrl);
        addNewsForm.reset();
        selectMediaType('none');
        addNewsModal.classList.remove('active');
        alert('Novità aggiunta con successo!');
    });
    
    editLinkForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const url = document.getElementById('linkUrl').value;
        const text = document.getElementById('linkText').value;
        
        if (!url || !text) {
            alert('Per favore, compila tutti i campi!');
            return;
        }
        
        updateContent({ 
            customLink: { url, text } 
        });
        
        editLinkModal.classList.remove('active');
        alert('Link configurato con successo!');
    });
    
    // Admin buttons
    editHomeBtn.addEventListener('click', function() {
        currentEditingElement = 'heroTitle';
        document.getElementById('contentTitle').value = heroTitle.textContent;
        document.getElementById('contentText').value = heroText.textContent;
        editContentModal.classList.add('active');
    });
    
    addNewsBtn.addEventListener('click', function() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('newsDate').value = today;
        addNewsModal.classList.add('active');
    });
    
    viewQuestionsBtn.addEventListener('click', function() {
        renderQuestions();
        adminQuestionsView.style.display = 'block';
        document.getElementById('domande').scrollIntoView({ behavior: 'smooth' });
    });
    
    editLinkBtn.addEventListener('click', function() {
        document.getElementById('linkUrl').value = customLinkConfig.url;
        document.getElementById('linkText').value = customLinkConfig.text;
        editLinkModal.classList.add('active');
    });
    
    // Pulsante Aggiorna Ora
    refreshNowBtn.addEventListener('click', async function() {
        showSyncIndicator();
        await loadAllData();
        setTimeout(() => {
            hideSyncIndicator();
            alert('Dati aggiornati!');
        }, 1000);
    });
    
    logoutBtn.addEventListener('click', logout);
    
    // Custom link behavior
    customLink.addEventListener('click', function(e) {
        if (!isAdmin) {
            e.preventDefault();
            alert('Questo link può essere configurato solo dagli amministratori. Effettua il login per accedere a questa funzionalità.');
            loginModal.classList.add('active');
        }
    });
}

// ==============================
// INIZIALIZZAZIONE
// ==============================

function init() {
    console.log('🚀 Avvio applicazione Comitato New Wave...');
    
    // Inizializzazione
    loadSecurityState();
    updateSecurityUI();
    checkLoginStatus();
    setupEventListeners();
    setupMediaHandlers();
    
    // Carica dati
    loadAllData();
    
    // Avvia sincronizzazione
    startSyncPolling();
}

// Avvia l'applicazione quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}