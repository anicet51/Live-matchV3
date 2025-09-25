// Application state
let matchState = {
    title: '⚽ Score Football Live',
    homeTeam: '',
    awayTeam: '',
    homeScore: 0,
    awayScore: 0,
    homeLogoBlobUrl: null,
    awayLogoBlobUrl: null,
    matchStartTime: null,
    currentTime: 0,
    isRunning: false,
    status: 'En attente',
    events: [],
    timerInterval: null
};

// DOM elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const chronoTime = document.getElementById('chronoTime');
const matchStatus = document.getElementById('matchStatus');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const homeScoreEl = document.getElementById('homeScore');
const awayScoreEl = document.getElementById('awayScore');
const homeEventsEl = document.getElementById('homeEvents');
const awayEventsEl = document.getElementById('awayEvents');
const timelineContainer = document.getElementById('timelineContainer');
const exportCanvas = document.getElementById('exportCanvas');
const matchTitle = document.getElementById('matchTitle');
const matchTitleInput = document.getElementById('matchTitleInput');
const saveTitleBtn = document.getElementById('saveTitleBtn');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    loadLocalData();
    initializeTabs();
    initializeScoreControls();
    initializeChronoControls();
    initializeEventButtons();
    initializeLogoUploads();
    initializeExport();
    initializeTitleEditor();
    updateDisplay();
    updateEventsList();
    updateTimeline();
});

// Save before unload
window.addEventListener('beforeunload', function() {
    saveLocalData();
});

// Data persistence functions
function saveLocalData() {
    try {
        const dataToSave = {
            ...matchState,
            timerInterval: null // Don't save the interval
        };
        localStorage.setItem('footballMatchState', JSON.stringify(dataToSave));
        console.log('Data saved');
    } catch (error) {
        console.warn('Could not save data:', error);
    }
}

function loadLocalData() {
    try {
        const savedData = localStorage.getItem('footballMatchState');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            matchState = { ...matchState, ...parsedData, timerInterval: null };
            
            // Restore title
            if (matchState.title) {
                matchTitle.textContent = matchState.title;
                matchTitleInput.value = matchState.title;
            }
            
            // Restore team names
            if (matchState.homeTeam) {
                document.getElementById('homeTeam').value = matchState.homeTeam;
            }
            if (matchState.awayTeam) {
                document.getElementById('awayTeam').value = matchState.awayTeam;
            }
            
            // Restore logos
            if (matchState.homeLogoBlobUrl) {
                const homeLogoEl = document.getElementById('homeLogo');
                homeLogoEl.innerHTML = `<img src="${matchState.homeLogoBlobUrl}" alt="Logo Domicile" class="logo-img">`;
            }
            if (matchState.awayLogoBlobUrl) {
                const awayLogoEl = document.getElementById('awayLogo');
                awayLogoEl.innerHTML = `<img src="${matchState.awayLogoBlobUrl}" alt="Logo Visiteur" class="logo-img">`;
            }
            
            console.log('Data loaded');
        }
    } catch (error) {
        console.warn('Could not load data:', error);
    }
}

// Title editor
function initializeTitleEditor() {
    saveTitleBtn.addEventListener('click', function() {
        const newTitle = matchTitleInput.value.trim();
        if (newTitle) {
            matchState.title = newTitle;
            matchTitle.textContent = newTitle;
            saveLocalData();
        }
    });
    
    matchTitleInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveTitleBtn.click();
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
            
            // Update timeline when switching to timeline tab
            if (tabId === 'timeline') {
                updateTimeline();
            }
        });
    });
}

// Score controls
function initializeScoreControls() {
    const scoreButtons = document.querySelectorAll('.score-btn');
    
    scoreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const team = this.dataset.team;
            const action = this.dataset.action;
            
            if (action === 'plus') {
                matchState[team + 'Score']++;
            } else if (action === 'minus' && matchState[team + 'Score'] > 0) {
                matchState[team + 'Score']--;
            }
            
            updateDisplay();
            saveLocalData();
        });
    });
}

// Chronometer controls
function initializeChronoControls() {
    startBtn.addEventListener('click', startMatch);
    pauseBtn.addEventListener('click', pauseMatch);
    resetBtn.addEventListener('click', resetMatch);
}

function startMatch() {
    if (!matchState.isRunning) {
        if (!matchState.matchStartTime) {
            matchState.matchStartTime = Date.now() - (matchState.currentTime * 1000);
        } else {
            matchState.matchStartTime = Date.now() - (matchState.currentTime * 1000);
        }
        
        matchState.isRunning = true;
        matchState.status = 'En cours';
        
        matchState.timerInterval = setInterval(updateTimer, 1000);
        
        startBtn.disabled = true;
        pauseBtn.disabled = false;
    }
    
    updateDisplay();
    saveLocalData();
}

function pauseMatch() {
    if (matchState.isRunning) {
        matchState.isRunning = false;
        matchState.status = 'En pause';
        
        if (matchState.timerInterval) {
            clearInterval(matchState.timerInterval);
            matchState.timerInterval = null;
        }
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    }
    
    updateDisplay();
    saveLocalData();
}

function resetMatch() {
    // COMPLETE RESET
    if (matchState.timerInterval) {
        clearInterval(matchState.timerInterval);
        matchState.timerInterval = null;
    }
    
    // Reset all timer variables
    matchState.matchStartTime = null;
    matchState.currentTime = 0;
    matchState.isRunning = false;
    matchState.status = 'En attente';
    
    // Reset buttons
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // Reset scores and events
    matchState.homeScore = 0;
    matchState.awayScore = 0;
    matchState.events = [];
    
    updateDisplay();
    updateEventsList();
    updateTimeline();
    saveLocalData();
}

function updateTimer() {
    if (matchState.isRunning && matchState.matchStartTime) {
        matchState.currentTime = Math.floor((Date.now() - matchState.matchStartTime) / 1000);
        updateDisplay();
        saveLocalData();
    }
}

// Event buttons - FIXED
function initializeEventButtons() {
    const eventButtons = document.querySelectorAll('.event-btn');
    
    eventButtons.forEach(button => {
        button.addEventListener('click', function() {
            const team = this.dataset.team;
            const eventType = this.dataset.event;
            
            addEvent(team, eventType);
        });
    });
}

function addEvent(team, eventType) {
    const event = {
        id: Date.now(),
        team: team,
        type: eventType,
        time: matchState.currentTime,
        timestamp: Date.now()
    };
    
    // Add goal to score if it's a goal event
    if (eventType === 'goal') {
        matchState[team + 'Score']++;
    }
    
    matchState.events.push(event);
    
    updateDisplay();
    updateEventsList();
    updateTimeline();
    saveLocalData();
}

// Logo upload system - Gallery only
function initializeLogoUploads() {
    // Home team logo
    const homeLogoFile = document.getElementById('homeLogoFile');
    const homeLogoFileBtn = document.getElementById('homeLogoFileBtn');
    const homeLogoDisplay = document.getElementById('homeLogo');
    
    homeLogoFileBtn.addEventListener('click', function() {
        homeLogoFile.click();
    });
    
    homeLogoFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                homeLogoDisplay.innerHTML = `<img src="${e.target.result}" alt="Logo Domicile" class="logo-img">`;
                matchState.homeLogoBlobUrl = e.target.result;
                saveLocalData();
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Away team logo
    const awayLogoFile = document.getElementById('awayLogoFile');
    const awayLogoFileBtn = document.getElementById('awayLogoFileBtn');
    const awayLogoDisplay = document.getElementById('awayLogo');
    
    awayLogoFileBtn.addEventListener('click', function() {
        awayLogoFile.click();
    });
    
    awayLogoFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                awayLogoDisplay.innerHTML = `<img src="${e.target.result}" alt="Logo Visiteur" class="logo-img">`;
                matchState.awayLogoBlobUrl = e.target.result;
                saveLocalData();
            };
            reader.readAsDataURL(file);
        }
    });
}

// Display updates
function updateDisplay() {
    // Update scores
    homeScoreEl.textContent = matchState.homeScore;
    awayScoreEl.textContent = matchState.awayScore;
    
    // Update timer
    const minutes = Math.floor(matchState.currentTime / 60);
    const seconds = matchState.currentTime % 60;
    chronoTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update status
    matchStatus.textContent = matchState.status;
    
    // Update team names from inputs
    const homeTeamInput = document.getElementById('homeTeam');
    const awayTeamInput = document.getElementById('awayTeam');
    
    if (homeTeamInput && homeTeamInput.value !== matchState.homeTeam) {
        matchState.homeTeam = homeTeamInput.value;
        saveLocalData();
    }
    if (awayTeamInput && awayTeamInput.value !== matchState.awayTeam) {
        matchState.awayTeam = awayTeamInput.value;
        saveLocalData();
    }
}

function updateEventsList() {
    // Clear existing events
    if (homeEventsEl) homeEventsEl.innerHTML = '';
    if (awayEventsEl) awayEventsEl.innerHTML = '';
    
    // Sort events by time
    const sortedEvents = matchState.events.sort((a, b) => a.time - b.time);
    
    sortedEvents.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = 'event-item';
        
        const minutes = Math.floor(event.time / 60);
        const eventIcon = getEventIcon(event.type);
        
        eventEl.innerHTML = `
            <span class="event-time">${minutes}'</span>
            <span class="event-icon">${eventIcon}</span>
            <span class="event-type">${getEventLabel(event.type)}</span>
        `;
        
        if (event.team === 'home' && homeEventsEl) {
            homeEventsEl.appendChild(eventEl);
        } else if (event.team === 'away' && awayEventsEl) {
            awayEventsEl.appendChild(eventEl);
        }
    });
}

function updateTimeline() {
    if (!timelineContainer) return;
    
    timelineContainer.innerHTML = '';
    
    if (matchState.events.length === 0) {
        timelineContainer.innerHTML = '<div class="timeline-empty">Aucun événement pour le moment</div>';
        return;
    }
    
    // Sort events by time
    const sortedEvents = matchState.events.sort((a, b) => a.time - b.time);
    
    sortedEvents.forEach(event => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        
        const minutes = Math.floor(event.time / 60);
        const teamName = event.team === 'home' ? (matchState.homeTeam || 'Domicile') : (matchState.awayTeam || 'Visiteur');
        const eventIcon = getEventIcon(event.type);
        
        timelineItem.innerHTML = `
            <div class="timeline-time">${minutes}'</div>
            <div class="timeline-content">
                <span class="timeline-icon">${eventIcon}</span>
                <span class="timeline-team">${teamName}</span>
                <span class="timeline-event">${getEventLabel(event.type)}</span>
            </div>
        `;
        
        timelineContainer.appendChild(timelineItem);
    });
}

function getEventIcon(eventType) {
    const icons = {
        goal: '⚽',
        yellow: '🟨',
        red: '🟥',
        substitution: '🔄'
    };
    return icons[eventType] || '📝';
}

function getEventLabel(eventType) {
    const labels = {
        goal: 'But',
        yellow: 'Carton Jaune',
        red: 'Carton Rouge',
        substitution: 'Remplacement'
    };
    return labels[eventType] || eventType;
}

// Export functionality
function initializeExport() {
    generateBtn.addEventListener('click', generateMatchImage);
    downloadBtn.addEventListener('click', downloadMatchImage);
}

function generateMatchImage() {
    const canvas = exportCanvas;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 1080;
    canvas.height = 1080;
    
    // Background
    ctx.fillStyle = '#1a5490';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(matchState.title, canvas.width/2, 80);
    
    // Teams and scores
    const homeTeam = matchState.homeTeam || 'Domicile';
    const awayTeam = matchState.awayTeam || 'Visiteur';
    
    ctx.font = 'bold 36px Arial';
    ctx.fillText(homeTeam, canvas.width/4, 200);
    ctx.fillText(awayTeam, 3*canvas.width/4, 200);
    
    // Scores
    ctx.font = 'bold 120px Arial';
    ctx.fillText(matchState.homeScore, canvas.width/4, 320);
    ctx.fillText('-', canvas.width/2, 320);
    ctx.fillText(matchState.awayScore, 3*canvas.width/4, 320);
    
    // Time
    const minutes = Math.floor(matchState.currentTime / 60);
    const seconds = matchState.currentTime % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    ctx.font = 'bold 48px Arial';
    ctx.fillText(timeStr, canvas.width/2, 420);
    
    // Events
    ctx.font = '28px Arial';
    ctx.textAlign = 'left';
    
    let yPos = 500;
    const sortedEvents = matchState.events.sort((a, b) => a.time - b.time);
    
    sortedEvents.forEach(event => {
        if (yPos > 1000) return; // Don't overflow
        
        const minutes = Math.floor(event.time / 60);
        const teamName = event.team === 'home' ? homeTeam : awayTeam;
        const icon = getEventIcon(event.type);
        const label = getEventLabel(event.type);
        
        ctx.fillText(`${minutes}' ${icon} ${teamName} - ${label}`, 100, yPos);
        yPos += 40;
    });
    
    // Show download button
    downloadBtn.style.display = 'block';
}

function downloadMatchImage() {
    const link = document.createElement('a');
    link.download = `match_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL();
    link.click();
}

// Auto-save on input changes
document.addEventListener('input', function(e) {
    if (e.target.id === 'homeTeam' || e.target.id === 'awayTeam') {
        setTimeout(saveLocalData, 500); // Debounce
    }
});

// Auto-save every 10 seconds
setInterval(saveLocalData, 10000);