// ==============================
// CONFIGURAZIONE GOOGLE DRIVE
// ==============================

const DRIVE_CONFIG = {
    NEWS_JSON: 'https://drive.google.com/uc?export=download&id=1PAzAdsmPTaBUdNBEYuv_AFLr7TGxDCSZ',
    QUESTIONS_JSON: 'https://drive.google.com/uc?export=download&id=1uovrNEF2D1XNMUKPHTzUSad-DwjXGLSO',
    CONTENT_JSON: 'https://drive.google.com/uc?export=download&id=1Jk_MBRqMXYnLhR8t8SdpfjRmpCOZKpfI'
};

// ==============================
// VARIABILI GLOBALI
// ==============================

let isAdmin = false;
let news = [];
let questions = [];
let customLinkConfig = { url: "#", text: "Link Aggiuntivo" };

// ==============================
// FUNZIONI PRINCIPALI DRIVE
// ==============================

// Carica dati da Google Drive
async function loadFromDrive(url) {
    try {
        console.log('📥 Caricamento da:', url);
        const cacheBusterUrl = `${url}&t=${Date.now()}`;
        const response = await fetch(cacheBusterUrl);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Dati caricati');
            return data;
        } else {
            console.error('❌ Errore HTTP:', response.status);
            return null;
        }
        
    } catch (error) {
        console.error('❌ Errore caricamento Drive:', error);
        return null;
    }
}

// Salva dati localmente (poi dovrai aggiornare manualmente i file su Drive)
function saveToLocalStorage(filename, data) {
    try {
        localStorage.setItem(`drive_${filename}`, JSON.stringify({
            data: data,
            timestamp: Date.now(),
            synced: false
        }));
        console.log('📱 Dati salvati localmente:', filename);
        return true;
    } catch (e) {
        console.error('❌ Errore salvataggio locale:', e);
        return false;
    }
}

// Carica dati locali
function loadFromLocalStorage(filename, defaultValue = null) {
    try {
        const stored = localStorage.getItem(`drive_${filename}`);
        if (stored) {
            return JSON.parse(stored).data;
        }
    } catch (e) {
        console.error('❌ Errore caricamento locale:', e);
    }
    return defaultValue;
}

// ==============================
// FUNZIONI APPLICAZIONE
// ==============================

// Aggiungi novità
async function addNews(title, date, content, mediaType = 'none', mediaUrl = '') {
    const newNews = {
        id: Date.now(),
        title,
        date,
        content,
        mediaType,
        mediaUrl,
        createdAt: new Date().toISOString()
    };

    // Carica news esistenti (prima da Drive, poi da locale)
    let existingNews = await loadFromDrive(DRIVE_CONFIG.NEWS_JSON);
    if (!existingNews) {
        existingNews = loadFromLocalStorage('news.json', []);
    }
    
    const updatedNews = [newNews, ...existingNews];
    
    // Salva localmente
    const success = saveToLocalStorage('news.json', updatedNews);
    
    if (success) {
        news = updatedNews;
        renderNews();
        showSuccess('Novità pubblicata! (Salvata localmente)');
        
        // Mostra istruzioni per aggiornare Drive
        showDriveUpdateInstructions('news.json', updatedNews);
    }
    
    return success;
}

// Aggiungi domanda
async function addQuestion(questionText) {
    const newQuestion = {
        id: Date.now(),
        text: questionText,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };

    let existingQuestions = await loadFromDrive(DRIVE_CONFIG.QUESTIONS_JSON);
    if (!existingQuestions) {
        existingQuestions = loadFromLocalStorage('questions.json', []);
    }
    
    const updatedQuestions = [...existingQuestions, newQuestion];
    
    const success = saveToLocalStorage('questions.json', updatedQuestions);
    
    if (success) {
        questions = updatedQuestions;
        if (isAdmin) renderQuestions();
        showSuccess('Domanda inviata! (Salvata localmente)');
        showDriveUpdateInstructions('questions.json', updatedQuestions);
    }
    
    return success;
}

// Aggiorna contenuti
async function updateContent(updates) {
    let existingContent = await loadFromDrive(DRIVE_CONFIG.CONTENT_JSON);
    if (!existingContent) {
        existingContent = loadFromLocalStorage('content.json', {});
    }
    
    const updatedContent = { ...existingContent, ...updates };
    
    const success = saveToLocalStorage('content.json', updatedContent);
    
    if (success) {
        // Aggiorna UI
        if (updates.heroTitle) heroTitle.textContent = updates.heroTitle;
        if (updates.heroText) heroText.textContent = updates.heroText;
        if (updates.customLink) {
            customLinkConfig = updates.customLink;
            updateCustomLink();
        }
        showSuccess('Contenuto aggiornato! (Salvato localmente)');
        showDriveUpdateInstructions('content.json', updatedContent);
    }
    
    return success;
}

// ==============================
// CARICAMENTO DATI
// ==============================

async function loadAllData() {
    console.log('🔄 Caricamento tutti i dati...');
    
    try {
        // Prova a caricare da Drive
        const [newsData, contentData, questionsData] = await Promise.all([
            loadFromDrive(DRIVE_CONFIG.NEWS_JSON),
            loadFromDrive(DRIVE_CONFIG.CONTENT_JSON),
            loadFromDrive(DRIVE_CONFIG.QUESTIONS_JSON)
        ]);
        
        // Se Drive non funziona, carica da locale
        if (newsData) {
            news = newsData;
            console.log('📰 News caricate da Drive:', news.length);
        } else {
            news = loadFromLocalStorage('news.json', []);
            console.log('📰 News caricate da locale:', news.length);
        }
        
        if (contentData) {
            if (contentData.heroTitle) heroTitle.textContent = contentData.heroTitle;
            if (contentData.heroText) heroText.textContent = contentData.heroText;
            if (contentData.customLink) {
                customLinkConfig = contentData.customLink;
                updateCustomLink();
            }
            console.log('📖 Contenuto caricato da Drive');
        } else {
            const localContent = loadFromLocalStorage('content.json', {});
            if (localContent.heroTitle) heroTitle.textContent = localContent.heroTitle;
            if (localContent.heroText) heroText.textContent = localContent.heroText;
            if (localContent.customLink) {
                customLinkConfig = localContent.customLink;
                updateCustomLink();
            }
            console.log('📖 Contenuto caricato da locale');
        }
        
        if (questionsData) {
            questions = questionsData;
            console.log('❓ Domande caricate da Drive:', questions.length);
        } else {
            questions = loadFromLocalStorage('questions.json', []);
            console.log('❓ Domande caricate da locale:', questions.length);
        }
        
        // Renderizza
        renderNews();
        if (isAdmin) {
            renderQuestions();
        }
        
        console.log('✅ Tutti i dati caricati');
        
    } catch (error) {
        console.error('❌ Errore caricamento dati:', error);
        // Fallback completo a dati locali
        loadLocalFallback();
    }
}

function loadLocalFallback() {
    console.log('🔄 Caricamento fallback da localStorage...');
    
    news = loadFromLocalStorage('news.json', []);
    questions = loadFromLocalStorage('questions.json', []);
    const content = loadFromLocalStorage('content.json', {});
    
    if (content.heroTitle) heroTitle.textContent = content.heroTitle;
    if (content.heroText) heroText.textContent = content.heroText;
    if (content.customLink) {
        customLinkConfig = content.customLink;
        updateCustomLink();
    }
    
    renderNews();
    if (isAdmin) renderQuestions();
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
    
    news.forEach(item => {
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
                    <img src="${item.mediaUrl}" alt="${item.title}" 
                         onerror="this.style.display='none'"
                         style="max-width: 100%; border-radius: 8px;">
                </div>
            `;
        } else if (item.mediaType === 'video' && item.mediaUrl) {
            mediaHTML = `
                <div class="media-container">
                    <video controls style="max-width: 100%; border-radius: 8px;">
                        <source src="${item.mediaUrl}" type="video/mp4">
                        Il tuo browser non supporta il video.
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

    if (isAdmin) {
        document.querySelectorAll('.delete-news-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteNews(id);
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
                    <div class="question-date">Ricevuta il: ${formatDate(question.date)}</div>
                </div>
                <div class="question-actions">
                    <button class="btn btn-danger delete-question-btn" data-id="${question.id}">Elimina</button>
                </div>
            </div>
        `;
        questionsList.appendChild(questionItem);
    });

    document.querySelectorAll('.delete-question-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteQuestion(id);
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

// Elimina news
async function deleteNews(id) {
    if (!confirm('Sei sicuro di voler eliminare questa notizia?')) return;
    
    const updatedNews = news.filter(n => n.id !== id);
    const success = saveToLocalStorage('news.json', updatedNews);
    
    if (success) {
        news = updatedNews;
        renderNews();
        showSuccess('News eliminata! (Aggiornata localmente)');
        showDriveUpdateInstructions('news.json', updatedNews);
    }
}

// Elimina domanda
async function deleteQuestion(id) {
    if (!confirm('Sei sicuro di voler eliminare questa domanda?')) return;
    
    const updatedQuestions = questions.filter(q => q.id !== id);
    const success = saveToLocalStorage('questions.json', updatedQuestions);
    
    if (success) {
        questions = updatedQuestions;
        renderQuestions();
        showSuccess('Domanda eliminata! (Aggiornata localmente)');
        showDriveUpdateInstructions('questions.json', updatedQuestions);
    }
}

// ==============================
// ISTRUZIONI AGGIORNAMENTO DRIVE
// ==============================

function showDriveUpdateInstructions(filename, data) {
    if (!isAdmin) return;
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const message = `
📝 <strong>Aggiornamento Google Drive Richiesto</strong><br><br>
Per sincronizzare i cambiamenti con tutti gli utenti:<br>
1. <strong>SCARICA</strong> il file aggiornato: <a href="${url}" download="${filename}">Clicca qui per scaricare ${filename}</a><br>
2. <strong>CARICALO</strong> su Google Drive sostituendo il file vecchio<br>
3. <strong>CONDIVIDI</strong> come "Chiunque con il link"<br><br>
<small>I dati sono già salvati localmente, ma solo aggiornando Drive saranno visibili a tutti.</small>
    `;
    
    showModalMessage(message, 'Aggiornamento Drive');
}

function showModalMessage(message, title = 'Informazione') {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="background: white; padding: 2rem; border-radius: 10px; max-width: 500px; margin: 1rem;">
            <h3>${title}</h3>
            <div>${message}</div>
            <button onclick="this.closest('.modal').remove()" 
                    style="margin-top: 1rem; padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Chiudi
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ==============================
// FUNZIONI UTILITY
// ==============================

function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}

function showLoading(message) {
    // Puoi implementare un loader migliore
    console.log('⏳ ' + message);
}

// ==============================
// INIZIALIZZAZIONE
// ==============================

async function initializeApp() {
    console.log('🚀 Avvio Comitato New Wave - Google Drive');
    
    // Carica sicurezza
    loadSecurityState();
    updateSecurityUI();
    checkLoginStatus();
    
    // Setup UI
    setupEventListeners();
    setupMediaHandlers();
    
    // Carica dati
    await loadAllData();
    
    console.log('✅ App inizializzata con Google Drive');
}

// Avvia l'app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
