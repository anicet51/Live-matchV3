// Application state
let matchState = {
    title: '⚽ Score Football Live',
    homeTeam: '',
    awayTeam: '',
    homeScore: 0,
    awayScore: 0,
    homeLogoDataUrl: null,
    awayLogoDataUrl: null,
    matchStartTime: null,
    currentTime: 0,
    isRunning: false,
    status: 'En attente',
    events: [],
    timerInterval: null,
    autoSaveInterval: null
};

// DOM elements
const matchTitle = document.getElementById('matchTitle');
const saveTitleBtn = document.getElementById('saveTitleBtn');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const chronoTime = document.getElementById('chronoTime');
const matchStatus = document.getElementById('matchStatus');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const homeScoreEl = document.getElementById('homeScore');
const awayScoreEl = document.getElementById('awayScore');
const eventsList = document.getElementById('eventsList');
const exportCanvas = document.getElementById('exportCanvas');
const homeTeamInput = document.getElementById('homeTeam');
const awayTeamInput = document.getElementById('awayTeam');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadLocalData();
    initializeTitle();
    initializeTabs();
    initializeScoreControls();
    initializeChronoControls();
    initializeEventButtons();
    initializeLogoUploads();
    initializeExport();
    initializeTimeline();
    initializeTeamInputs();
    startAutoSave();
    setupBeforeUnload();
});

// LocalStorage functions
function saveLocalData() {
    try {
        const dataToSave = {
            title: matchState.title,
            homeTeam: matchState.homeTeam,
            awayTeam: matchState.awayTeam,
            homeScore: matchState.homeScore,
            awayScore: matchState.awayScore,
            homeLogoDataUrl: matchState.homeLogoDataUrl,
            awayLogoDataUrl: matchState.awayLogoDataUrl,
            currentTime: matchState.currentTime,
            status: matchState.status,
            events: matchState.events,
            isRunning: matchState.isRunning,
            matchStartTime: matchState.matchStartTime
        };
        localStorage.setItem('footballScoreApp', JSON.stringify(dataToSave));
        console.log('Données sauvegardées automatiquement');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
    }
}

function loadLocalData() {
    try {
        const savedData = localStorage.getItem('footballScoreApp');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Restore all data
            matchState.title = data.title || '⚽ Score Football Live';
            matchState.homeTeam = data.homeTeam || '';
            matchState.awayTeam = data.awayTeam || '';
            matchState.homeScore = data.homeScore || 0;
            matchState.awayScore = data.awayScore || 0;
            matchState.homeLogoDataUrl = data.homeLogoDataUrl || null;
            matchState.awayLogoDataUrl = data.awayLogoDataUrl || null;
            matchState.currentTime = data.currentTime || 0;
            matchState.status = data.status || 'En attente';
            matchState.events = data.events || [];
            matchState.isRunning = data.isRunning || false;
            matchState.matchStartTime = data.matchStartTime || null;
            
            // Update UI elements
            if (matchTitle) matchTitle.value = matchState.title;
            if (homeTeamInput) homeTeamInput.value = matchState.homeTeam;
            if (awayTeamInput) awayTeamInput.value = matchState.awayTeam;
            if (homeScoreEl) homeScoreEl.textContent = matchState.homeScore;
            if (awayScoreEl) awayScoreEl.textContent = matchState.awayScore;
            
            // Restore logos
            if (matchState.homeLogoDataUrl) {
                const homeLogo = document.getElementById('homeLogo');
                if (homeLogo) {
                    homeLogo.innerHTML = `<img src="${matchState.homeLogoDataUrl}" alt="Logo domicile">`;
                }
            }
            
            if (matchState.awayLogoDataUrl) {
                const awayLogo = document.getElementById('awayLogo');
                if (awayLogo) {
                    awayLogo.innerHTML = `<img src="${matchState.awayLogoDataUrl}" alt="Logo visiteur">`;
                }
            }
            
            // Restore chrono state
            updateChronoDisplay();
            updateStatusDisplay();
            updateButtonStates();
            updateTimeline();
            
            console.log('Données restaurées depuis localStorage');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
}

function startAutoSave() {
    // Auto-save every 10 seconds
    matchState.autoSaveInterval = setInterval(saveLocalData, 10000);
}

function setupBeforeUnload() {
    window.addEventListener('beforeunload', function() {
        saveLocalData();
    });
}

// Title management
function initializeTitle() {
    saveTitleBtn.addEventListener('click', function() {
        matchState.title = matchTitle.value.trim() || '⚽ Score Football Live';
        saveLocalData();
        
        // Visual feedback
        const originalText = saveTitleBtn.textContent;
        saveTitleBtn.textContent = '✅ Sauvé!';
        setTimeout(() => {
            saveTitleBtn.textContent = originalText;
        }, 1500);
    });
    
    matchTitle.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            matchState.title = matchTitle.value.trim() || '⚽ Score Football Live';
            saveLocalData();
        }
    });
}

// Tab system
function initializeTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Logo upload system - Gallery only - Fixed selectors
function initializeLogoUploads() {
    const homeLogoFile = document.getElementById('homeLogoFile');
    const awayLogoFile = document.getElementById('awayLogoFile');
    const homeUploadBtn = document.querySelector('.logo-upload-btn[data-team="home"]');
    const awayUploadBtn = document.querySelector('.logo-upload-btn[data-team="away"]');

    // Button click handlers - Fixed to properly trigger file picker
    if (homeUploadBtn) {
        homeUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            homeLogoFile.click();
        });
    }

    if (awayUploadBtn) {
        awayUploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            awayLogoFile.click();
        });
    }

    // File upload handlers
    if (homeLogoFile) {
        homeLogoFile.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleLogoFileUpload(e.target.files[0], 'home');
            }
        });
    }

    if (awayLogoFile) {
        awayLogoFile.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleLogoFileUpload(e.target.files[0], 'away');
            }
        });
    }
}

function handleLogoFileUpload(file, team) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image valide');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        createAndDisplayLogo(e.target.result, team);
    };
    reader.onerror = () => {
        alert('Erreur lors de la lecture du fichier');
    };
    reader.readAsDataURL(file);
}

function createAndDisplayLogo(src, team) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
        // Set canvas size
        canvas.width = 80;
        canvas.height = 80;
        
        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 80, 80);
        
        // Calculate dimensions to fit image while maintaining aspect ratio
        const scale = Math.min(80 / img.width, 80 / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (80 - width) / 2;
        const y = (80 - height) / 2;
        
        // Draw the image
        ctx.drawImage(img, x, y, width, height);
        
        // Convert to data URL for storage
        const dataUrl = canvas.toDataURL('image/png');
        
        // Store the data URL
        if (team === 'home') {
            matchState.homeLogoDataUrl = dataUrl;
        } else {
            matchState.awayLogoDataUrl = dataUrl;
        }
        
        // Display the logo immediately
        const logoElement = document.getElementById(team === 'home' ? 'homeLogo' : 'awayLogo');
        logoElement.innerHTML = `<img src="${dataUrl}" alt="Logo ${team}">`;
        
        // Save to localStorage
        saveLocalData();
        
        console.log(`Logo ${team} mis à jour avec succès`);
    };
    
    img.onerror = () => {
        alert('Erreur lors du traitement de l\'image');
    };
    
    img.src = src;
}

// Team input tracking
function initializeTeamInputs() {
    homeTeamInput.addEventListener('input', (e) => {
        matchState.homeTeam = e.target.value;
        saveLocalData();
    });

    awayTeamInput.addEventListener('input', (e) => {
        matchState.awayTeam = e.target.value;
        saveLocalData();
    });
}

// Score controls
function initializeScoreControls() {
    const scoreButtons = document.querySelectorAll('.score-btn');
    
    scoreButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const team = btn.dataset.team;
            const action = btn.dataset.action;
            
            if (team === 'home') {
                if (action === 'plus') {
                    matchState.homeScore++;
                } else if (action === 'minus' && matchState.homeScore > 0) {
                    matchState.homeScore--;
                }
                homeScoreEl.textContent = matchState.homeScore;
            } else {
                if (action === 'plus') {
                    matchState.awayScore++;
                } else if (action === 'minus' && matchState.awayScore > 0) {
                    matchState.awayScore--;
                }
                awayScoreEl.textContent = matchState.awayScore;
            }
            
            saveLocalData();
        });
    });
}

// Chrono controls - Complete implementation
function initializeChronoControls() {
    startBtn.addEventListener('click', startChrono);
    pauseBtn.addEventListener('click', pauseChrono);
    resetBtn.addEventListener('click', resetChrono);
    
    // Resume timer if it was running
    if (matchState.isRunning && matchState.matchStartTime) {
        resumeChrono();
    }
}

function startChrono() {
    if (!matchState.isRunning) {
        if (matchState.matchStartTime === null) {
            matchState.matchStartTime = Date.now() - matchState.currentTime;
        } else {
            matchState.matchStartTime = Date.now() - matchState.currentTime;
        }
        
        matchState.isRunning = true;
        matchState.status = 'En cours';
        
        matchState.timerInterval = setInterval(updateChrono, 1000);
        updateButtonStates();
        updateStatusDisplay();
        saveLocalData();
    }
}

function pauseChrono() {
    if (matchState.isRunning) {
        matchState.isRunning = false;
        matchState.status = 'En pause';
        
        if (matchState.timerInterval) {
            clearInterval(matchState.timerInterval);
            matchState.timerInterval = null;
        }
        
        updateButtonStates();
        updateStatusDisplay();
        saveLocalData();
    }
}

function resetChrono() {
    // Stop the timer completely
    matchState.isRunning = false;
    
    // Clear any existing interval
    if (matchState.timerInterval) {
        clearInterval(matchState.timerInterval);
        matchState.timerInterval = null;
    }
    
    // Reset all time-related variables to initial state
    matchState.matchStartTime = null;
    matchState.currentTime = 0;
    matchState.status = 'En attente';
    
    // Reset display to 00:00 - Guaranteed
    chronoTime.textContent = '00:00';
    
    updateButtonStates();
    updateStatusDisplay();
    saveLocalData();
    
    console.log('Chrono complètement remis à zéro');
}

function resumeChrono() {
    if (matchState.isRunning) {
        matchState.matchStartTime = Date.now() - matchState.currentTime;
        matchState.timerInterval = setInterval(updateChrono, 1000);
        updateButtonStates();
        updateStatusDisplay();
    }
}

function updateChrono() {
    if (matchState.isRunning && matchState.matchStartTime) {
        matchState.currentTime = Date.now() - matchState.matchStartTime;
        updateChronoDisplay();
    }
}

function updateChronoDisplay() {
    const minutes = Math.floor(matchState.currentTime / 60000);
    const seconds = Math.floor((matchState.currentTime % 60000) / 1000);
    chronoTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateButtonStates() {
    startBtn.disabled = matchState.isRunning;
    pauseBtn.disabled = !matchState.isRunning;
}

function updateStatusDisplay() {
    matchStatus.textContent = matchState.status;
    matchStatus.className = 'status';
    
    if (matchState.status === 'En cours') {
        matchStatus.classList.add('status--playing');
    } else if (matchState.status === 'En pause') {
        matchStatus.classList.add('status--paused');
    } else {
        matchStatus.classList.add('status--info');
    }
}

// Event system - ALL FUNCTIONAL buttons including substitution
function initializeEventButtons() {
    const eventButtons = document.querySelectorAll('.event-btn');
    
    eventButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const team = btn.dataset.team;
            const eventType = btn.dataset.event;
            addEvent(team, eventType);
        });
    });
}

function addEvent(team, eventType) {
    const currentMinute = Math.floor(matchState.currentTime / 60000);
    const teamName = team === 'home' ? 
        (matchState.homeTeam || 'Domicile') : 
        (matchState.awayTeam || 'Visiteur');
    
    const eventIcons = {
        goal: '⚽',
        yellow: '🟨',
        red: '🟥',
        substitution: '🔄'
    };
    
    const eventNames = {
        goal: 'But',
        yellow: 'Carton jaune',
        red: 'Carton rouge',
        substitution: 'Remplacement'
    };
    
    const event = {
        time: currentMinute,
        team: team,
        teamName: teamName,
        type: eventType,
        icon: eventIcons[eventType],
        name: eventNames[eventType],
        timestamp: Date.now()
    };
    
    matchState.events.push(event);
    
    // If it's a goal, increment the score automatically
    if (eventType === 'goal') {
        if (team === 'home') {
            matchState.homeScore++;
            homeScoreEl.textContent = matchState.homeScore;
        } else {
            matchState.awayScore++;
            awayScoreEl.textContent = matchState.awayScore;
        }
    }
    
    updateTimeline();
    saveLocalData();
    
    console.log(`Événement ajouté: ${eventNames[eventType]} pour ${teamName} à ${currentMinute}'`);
}

// Timeline
function initializeTimeline() {
    document.getElementById('clearTimeline').addEventListener('click', () => {
        matchState.events = [];
        updateTimeline();
        saveLocalData();
    });
}

function updateTimeline() {
    if (matchState.events.length === 0) {
        eventsList.innerHTML = '<p class="no-events">Aucun événement pour le moment</p>';
        return;
    }
    
    const sortedEvents = [...matchState.events].sort((a, b) => b.timestamp - a.timestamp);
    
    eventsList.innerHTML = sortedEvents.map(event => `
        <div class="timeline-event ${event.team}">
            <span class="timeline-time">${event.time}'</span>
            <span class="timeline-description">${event.icon} ${event.name} - ${event.teamName}</span>
        </div>
    `).join('');
}

// Export system - WhatsApp Canvas 1080x1080
function initializeExport() {
    document.getElementById('generateExport').addEventListener('click', generateExportImage);
    document.getElementById('downloadExport').addEventListener('click', downloadExport);
    document.getElementById('shareWhatsApp').addEventListener('click', shareToWhatsApp);
}

function generateExportImage() {
    const canvas = exportCanvas;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size for WhatsApp (1080x1080 scaled to 540x540 for display)
    canvas.width = 540;
    canvas.height = 540;
    
    // Clear canvas and set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw header with custom title
    ctx.fillStyle = '#1f2121';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(matchState.title, canvas.width / 2, 40);
    
    // Get team names
    const homeTeamName = matchState.homeTeam || 'Domicile';
    const awayTeamName = matchState.awayTeam || 'Visiteur';
    
    // Draw team info
    const teamY = 100;
    const logoSize = 60;
    
    let loadedImages = 0;
    const totalImages = 2;
    
    function checkAllLoaded() {
        loadedImages++;
        if (loadedImages >= totalImages) {
            finishDrawing();
        }
    }
    
    // Home team logo
    if (matchState.homeLogoDataUrl) {
        const homeImg = new Image();
        homeImg.onload = () => {
            ctx.drawImage(homeImg, 60, teamY, logoSize, logoSize);
            checkAllLoaded();
        };
        homeImg.onerror = () => {
            drawDefaultHomeLogo();
            checkAllLoaded();
        };
        homeImg.src = matchState.homeLogoDataUrl;
    } else {
        drawDefaultHomeLogo();
        checkAllLoaded();
    }
    
    // Away team logo
    if (matchState.awayLogoDataUrl) {
        const awayImg = new Image();
        awayImg.onload = () => {
            ctx.drawImage(awayImg, canvas.width - 60 - logoSize, teamY, logoSize, logoSize);
            checkAllLoaded();
        };
        awayImg.onerror = () => {
            drawDefaultAwayLogo();
            checkAllLoaded();
        };
        awayImg.src = matchState.awayLogoDataUrl;
    } else {
        drawDefaultAwayLogo();
        checkAllLoaded();
    }
    
    function drawDefaultHomeLogo() {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(60, teamY, logoSize, logoSize);
        ctx.fillStyle = '#666';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏠', 60 + logoSize/2, teamY + logoSize/2 + 12);
    }
    
    function drawDefaultAwayLogo() {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(canvas.width - 60 - logoSize, teamY, logoSize, logoSize);
        ctx.fillStyle = '#666';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✈️', canvas.width - 60 - logoSize/2, teamY + logoSize/2 + 12);
    }
    
    function finishDrawing() {
        // Team names
        ctx.fillStyle = '#1f2121';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(homeTeamName, 90, teamY + logoSize + 25);
        ctx.fillText(awayTeamName, canvas.width - 90, teamY + logoSize + 25);
        
        // Score
        ctx.fillStyle = '#21808d';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${matchState.homeScore} - ${matchState.awayScore}`, canvas.width / 2, 240);
        
        // Time and status
        ctx.fillStyle = '#626c71';
        ctx.font = '20px Arial';
        ctx.fillText(chronoTime.textContent, canvas.width / 2, 280);
        ctx.fillText(matchState.status, canvas.width / 2, 310);
        
        // Recent events
        if (matchState.events.length > 0) {
            ctx.fillStyle = '#1f2121';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('Derniers événements:', canvas.width / 2, 360);
            
            const recentEvents = [...matchState.events].slice(-5).reverse();
            recentEvents.forEach((event, index) => {
                ctx.font = '14px Arial';
                const yPos = 385 + (index * 25);
                if (yPos < 500) {
                    ctx.fillText(`${event.time}' ${event.icon} ${event.name} - ${event.teamName}`, 
                        canvas.width / 2, yPos);
                }
            });
        }
        
        // Footer
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial';
        ctx.fillText('Généré par Score Football Live', canvas.width / 2, canvas.height - 20);
        
        // Show download and share buttons
        document.getElementById('downloadExport').style.display = 'block';
        document.getElementById('shareWhatsApp').style.display = 'block';
    }
}

function downloadExport() {
    const link = document.createElement('a');
    link.download = 'match-score-whatsapp.png';
    link.href = exportCanvas.toDataURL();
    link.click();
}

function shareToWhatsApp() {
    exportCanvas.toBlob((blob) => {
        if (navigator.share) {
            const file = new File([blob], 'match-score.png', { type: 'image/png' });
            navigator.share({
                files: [file],
                title: 'Score du Match',
                text: `${matchState.homeTeam || 'Domicile'} ${matchState.homeScore} - ${matchState.awayScore} ${matchState.awayTeam || 'Visiteur'}`
            }).catch(console.error);
        } else {
            // Fallback: download the image
            downloadExport();
            alert('Image téléchargée ! Partagez-la manuellement sur WhatsApp.');
        }
    });
}