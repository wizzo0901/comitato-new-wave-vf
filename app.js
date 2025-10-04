// ==============================
// CONFIGURAZIONE GITHUB SICURA
// ==============================

const GITHUB_CONFIG = {
    username: 'Wizzo0901',
    repo: 'comitato-newwave', 
    branch: 'main',
    // ⚠️ IMPORTANTE: Sostituisci con il TUO nuovo token sicuro
    token: 'ghp_il_tuo_nuovo_token_sicuro_qui',
    dataPath: 'data/'
};

// ==============================
// SICUREZZA E VALIDAZIONE
// ==============================

const COMPROMISED_TOKENS = [
    'ghp_yodwP8Pu8mRW1xyeOCIoTZrU6SOV3A34JWR'
];

function isTokenCompromised(token) {
    return COMPROMISED_TOKENS.includes(token);
}

function validateGitHubConfig() {
    if (!GITHUB_CONFIG.token || GITHUB_CONFIG.token === 'ghp_il_tuo_nuovo_token_sicuro_qui') {
        console.warn('⚠️ Token GitHub non configurato');
        return false;
    }
    
    if (isTokenCompromised(GITHUB_CONFIG.token)) {
        console.error('🚨 TOKEN COMPROMESSO RILEVATO!');
        alert('ERRORE SICUREZZA: Token GitHub compromesso. Contatta l\'amministratore.');
        return false;
    }
    
    return true;
}

// ==============================
// FUNZIONI GITHUB SICURE
// ==============================

async function saveToGitHub(filename, data) {
    console.log('💾 Tentativo salvataggio su GitHub:', filename);
    
    // Validazione sicurezza
    if (!validateGitHubConfig()) {
        console.log('🔒 Salvataggio in modalità sicura (locale)');
        return saveToLocalStorage(filename, data);
    }
    
    try {
        const jsonString = JSON.stringify(data, null, 2);
        const content = btoa(unescape(encodeURIComponent(jsonString)));
        
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}${filename}`;
        
        // Verifica file esistente
        let sha = null;
        try {
            const existingResponse = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (existingResponse.ok) {
                const existingData = await existingResponse.json();
                sha = existingData.sha;
            }
        } catch (e) {
            console.log('📝 Creazione nuovo file');
        }
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Aggiornamento ${filename} - ${new Date().toLocaleString('it-IT')}`,
                content: content,
                branch: GITHUB_CONFIG.branch,
                sha: sha
            })
        });
        
        if (response.ok) {
            console.log('✅ Salvataggio GitHub completato');
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ Errore GitHub:', response.status, errorText);
            throw new Error(`GitHub ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Errore salvataggio GitHub, fallback a locale:', error);
        return saveToLocalStorage(filename, data);
    }
}

function saveToLocalStorage(filename, data) {
    try {
        localStorage.setItem(`local_${filename}`, JSON.stringify({
            data: data,
            timestamp: Date.now(),
            synced: false
        }));
        console.log('📱 Dati salvati localmente');
        return true;
    } catch (e) {
        console.error('❌ Errore salvataggio locale:', e);
        return false;
    }
}

// Funzione per inizializzare la repository
async function initializeGitHubRepository() {
    if (!validateGitHubConfig()) {
        console.log('🚨 Impossibile inizializzare - token non sicuro');
        return false;
    }
    
    const initialFiles = {
        'news.json': [],
        'questions.json': [],
        'content.json': {
            heroTitle: "COMITATO STUDENTESCO NEW WAVE",
            heroText: "L'onda del cambiamento nella tua scuola. Innovazione, rappresentanza e partecipazione attiva per tutti gli studenti.",
            customLink: {
                url: "#",
                text: "Link Aggiuntivo"
            }
        }
    };

    console.log('🚀 Inizializzazione repository GitHub...');
    
    for (const [filename, data] of Object.entries(initialFiles)) {
        console.log(`📝 Inizializzo ${filename}...`);
        const success = await saveToGitHub(filename, data);
        console.log(success ? `✅ ${filename} inizializzato` : `❌ ${filename} fallito`);
    }
    
    return true;
}

// [Il resto del codice rimane uguale...]
