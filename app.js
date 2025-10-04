// ==============================
// CONFIGURAZIONE GITHUB AGGIORNATA
// ==============================

const GITHUB_CONFIG = {
    username: 'Wizzo0901',
    repo: 'comitato-newwave',
    branch: 'main',
    // ✅ USA QUESTO TOKEN - è un fine-grained token più sicuro
    token: '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',
    dataPath: 'data/'
};

// ==============================
// FUNZIONI GITHUB AGGIORNATE PER FINE-GRAINED TOKENS
// ==============================

async function saveToGitHub(filename, data) {
    console.log('💾 Salvataggio su GitHub:', filename);
    
    try {
        const jsonString = JSON.stringify(data, null, 2);
        // Codifica Base64 corretta
        const content = btoa(unescape(encodeURIComponent(jsonString)));
        
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}${filename}`;
        
        console.log('🔍 Verifico file esistente...');
        
        // PRIMA verifica se il file esiste
        let sha = null;
        
        try {
            const existingResponse = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });
            
            if (existingResponse.status === 200) {
                const existingData = await existingResponse.json();
                sha = existingData.sha;
                console.log('📁 File esistente trovato, SHA:', sha ? 'presente' : 'null');
            } else if (existingResponse.status === 404) {
                console.log('📝 File non esistente, creazione nuovo');
            } else {
                console.error('❌ Errore verifica file:', existingResponse.status);
                const errorText = await existingResponse.text();
                console.error('Dettaglio errore:', errorText);
            }
        } catch (e) {
            console.error('❌ Errore nella verifica esistenza file:', e);
        }
        
        console.log('🚀 Invio dati a GitHub...');
        
        const requestBody = {
            message: `Aggiornamento ${filename} - ${new Date().toLocaleString('it-IT')}`,
            content: content,
            branch: GITHUB_CONFIG.branch
        };
        
        // Aggiungi SHA solo se il file esiste
        if (sha) {
            requestBody.sha = sha;
        }
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('📡 Risposta GitHub:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Salvataggio completato! Commit:', result.commit.sha.substring(0, 7));
            return true;
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            console.error('❌ Errore GitHub dettagliato:', {
                status: response.status,
                message: errorData.message,
                documentation: errorData.documentation_url
            });
            
            if (response.status === 401) {
                throw new Error('TOKEN NON AUTORIZZATO: Verifica che il token abbia i permessi per questa repository');
            } else if (response.status === 403) {
                throw new Error('PERMESSI INSUFFICIENTI: Il token potrebbe essere un fine-grained token - verifica i permessi');
            } else if (response.status === 404) {
                throw new Error('REPOSITORY NON TROVATA: Verifica che la repository esista e sia pubblica');
            } else {
                throw new Error(`Errore GitHub ${response.status}: ${errorData.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Errore salvataggio GitHub:', error);
        
        // Salvataggio di emergenza locale
        const backupKey = `backup_${filename}_${Date.now()}`;
        try {
            localStorage.setItem(backupKey, JSON.stringify({
                data: data,
                timestamp: new Date().toISOString(),
                error: error.message
            }));
            console.log('📱 Backup locale salvato:', backupKey);
        } catch (e) {
            console.error('❌ Impossibile salvare backup locale:', e);
        }
        
        return false;
    }
}

// Funzione per testare la connessione
async function testGitHubConnection() {
    console.log('🔍 Test connessione GitHub...');
    
    try {
        const testUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}`;
        const response = await fetch(testUrl, {
            headers: {
                'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });
        
        if (response.ok) {
            const repoInfo = await response.json();
            console.log('✅ Repository accessibile:', repoInfo.full_name);
            console.log('👀 Visibilità:', repoInfo.visibility);
            console.log('📊 Ultimo aggiornamento:', repoInfo.updated_at);
            return true;
        } else {
            console.error('❌ Repository non accessibile. Status:', response.status);
            
            if (response.status === 401) {
                console.error('🔐 Errore 401 - Possibili cause:');
                console.error('   • Token scaduto o revocato');
                console.error('   • Token senza permessi sufficienti');
                console.error('   • Repository privata senza accesso');
            } else if (response.status === 404) {
                console.error('🔍 Errore 404 - Repository non trovata');
                console.error('   • Verifica che la repository esista');
                console.error('   • Verifica username e nome repository');
            }
            
            return false;
        }
    } catch (error) {
        console.error('❌ Errore di connessione:', error.message);
        return false;
    }
}

// Funzione per inizializzare la repository
async function initializeGitHubRepository() {
    console.log('🚀 Inizializzazione repository GitHub...');
    
    const connectionOk = await testGitHubConnection();
    if (!connectionOk) {
        console.error('❌ Impossibile inizializzare: connessione fallita');
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

    let allSuccess = true;
    
    for (const [filename, data] of Object.entries(initialFiles)) {
        console.log(`📝 Inizializzo ${filename}...`);
        const success = await saveToGitHub(filename, data);
        
        if (success) {
            console.log(`✅ ${filename} inizializzato`);
        } else {
            console.error(`❌ ${filename} fallito`);
            allSuccess = false;
        }
        
        // Aspetta un po' tra una richiesta e l'altra
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (allSuccess) {
        console.log('🎉 Repository inizializzata con successo!');
        alert('Repository GitHub inizializzata con successo! 🎉');
    } else {
        console.log('⚠️ Repository parzialmente inizializzata');
        alert('Repository inizializzata parzialmente. Controlla la console per i dettagli.');
    }
    
    return allSuccess;
}
