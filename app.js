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
    timerInterval: null
};

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
    updateDisplay();
    updateEventsList();
    updateTimeline();
    startAutoSave();
});

// Save before unload
window.addEventListener('beforeunload', saveLocalData);

// Title management
function initializeTitle() {
    const titleInput = document.getElementById('matchTitleInput');
    const titleDisplay = document.getElementById('matchTitle');
    const saveBtn = document.getElementById('saveTitleBtn');

    saveBtn.addEventListener('click', function() {
        const newTitle = titleInput.value.trim();
        if (newTitle) {
            matchState.title = newTitle;
            titleDisplay.textContent = newTitle;
            saveLocalData();
        }
    });

    titleInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });
}

// Tab system
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');

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
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');

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

        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
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

        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
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

    matchState.matchStartTime = null;
    matchState.currentTime = 0;
    matchState.isRunning = false;
    matchState.status = 'En attente';

    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;

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
    }
}

// Event buttons
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

    if (eventType === 'goal') {
        matchState[team + 'Score']++;
    }

    matchState.events.push(event);

    updateDisplay();
    updateEventsList();
    updateTimeline();
    saveLocalData();
}

// Logo uploads
function initializeLogoUploads() {
    const homeLogoBtn = document.getElementById('homeLogoBtn');
    const homeLogoFile = document.getElementById('homeLogoFile');
    const awayLogoBtn = document.getElementById('awayLogoBtn');
    const awayLogoFile = document.getElementById('awayLogoFile');

    homeLogoBtn.addEventListener('click', () => homeLogoFile.click());
    awayLogoBtn.addEventListener('click', () => awayLogoFile.click());

    homeLogoFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('homeLogo').innerHTML = 
                    `<img src="${e.target.result}" alt="Logo Domicile" class="logo-img">`;
                matchState.homeLogoDataUrl = e.target.result;
                saveLocalData();
            };
            reader.readAsDataURL(file);
        }
    });

    awayLogoFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('awayLogo').innerHTML = 
                    `<img src="${e.target.result}" alt="Logo Visiteur" class="logo-img">`;
                matchState.awayLogoDataUrl = e.target.result;
                saveLocalData();
            };
            reader.readAsDataURL(file);
        }
    });
}

// Display updates
function updateDisplay() {
    document.getElementById('homeScore').textContent = matchState.homeScore;
    document.getElementById('awayScore').textContent = matchState.awayScore;

    const minutes = Math.floor(matchState.currentTime / 60);
    const seconds = matchState.currentTime % 60;
    document.getElementById('chronoTime').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    document.getElementById('matchStatus').textContent = matchState.status;

    const homeTeamInput = document.getElementById('homeTeam');
    const awayTeamInput = document.getElementById('awayTeam');

    if (homeTeamInput && homeTeamInput.value !== matchState.homeTeam) {
        matchState.homeTeam = homeTeamInput.value;
    }
    if (awayTeamInput && awayTeamInput.value !== matchState.awayTeam) {
        matchState.awayTeam = awayTeamInput.value;
    }
}

function updateEventsList() {
    const homeEvents = document.getElementById('homeEvents');
    const awayEvents = document.getElementById('awayEvents');

    if (homeEvents) homeEvents.innerHTML = '';
    if (awayEvents) awayEvents.innerHTML = '';

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

        if (event.team === 'home' && homeEvents) {
            homeEvents.appendChild(eventEl);
        } else if (event.team === 'away' && awayEvents) {
            awayEvents.appendChild(eventEl);
        }
    });
}

function updateTimeline() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;

    container.innerHTML = '';

    if (matchState.events.length === 0) {
        container.innerHTML = '<div class="timeline-empty">Aucun événement pour le moment</div>';
        return;
    }

    const sortedEvents = matchState.events.sort((a, b) => a.time - b.time);

    sortedEvents.forEach(event => {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const minutes = Math.floor(event.time / 60);
        const teamName = event.team === 'home' ? (matchState.homeTeam || 'Domicile') : (matchState.awayTeam || 'Visiteur');
        const eventIcon = getEventIcon(event.type);

        item.innerHTML = `
            <div class="timeline-time">${minutes}'</div>
            <div class="timeline-content">
                <span class="timeline-icon">${eventIcon}</span>
                <span class="timeline-team">${teamName}</span>
                <span class="timeline-event">${getEventLabel(event.type)}</span>
            </div>
        `;

        container.appendChild(item);
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
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    generateBtn.addEventListener('click', generateMatchImage);
    downloadBtn.addEventListener('click', downloadMatchImage);
}

function generateMatchImage() {
    const canvas = document.getElementById('exportCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 1080;
    canvas.height = 1080;

    ctx.fillStyle = '#1a5490';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(matchState.title, canvas.width/2, 80);

    const homeTeam = matchState.homeTeam || 'Domicile';
    const awayTeam = matchState.awayTeam || 'Visiteur';

    ctx.font = 'bold 36px Arial';
    ctx.fillText(homeTeam, canvas.width/4, 200);
    ctx.fillText(awayTeam, 3*canvas.width/4, 200);

    ctx.font = 'bold 120px Arial';
    ctx.fillText(matchState.homeScore, canvas.width/4, 320);
    ctx.fillText('-', canvas.width/2, 320);
    ctx.fillText(matchState.awayScore, 3*canvas.width/4, 320);

    const minutes = Math.floor(matchState.currentTime / 60);
    const seconds = matchState.currentTime % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    ctx.font = 'bold 48px Arial';
    ctx.fillText(timeStr, canvas.width/2, 420);

    ctx.font = '28px Arial';
    ctx.textAlign = 'left';

    let yPos = 500;
    const sortedEvents = matchState.events.sort((a, b) => a.time - b.time);

    sortedEvents.forEach(event => {
        if (yPos > 1000) return;

        const minutes = Math.floor(event.time / 60);
        const teamName = event.team === 'home' ? homeTeam : awayTeam;
        const icon = getEventIcon(event.type);
        const label = getEventLabel(event.type);

        ctx.fillText(`${minutes}' ${icon} ${teamName} - ${label}`, 100, yPos);
        yPos += 40;
    });

    document.getElementById('downloadBtn').style.display = 'block';
}

function downloadMatchImage() {
    const canvas = document.getElementById('exportCanvas');
    const link = document.createElement('a');
    link.download = `match_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

// LocalStorage functions
function saveLocalData() {
    try {
        localStorage.setItem('footballMatchState', JSON.stringify(matchState));
    } catch (error) {
        console.warn('Could not save data:', error);
    }
}

function loadLocalData() {
    try {
        const saved = localStorage.getItem('footballMatchState');
        if (saved) {
            const savedState = JSON.parse(saved);
            Object.assign(matchState, savedState);
            matchState.timerInterval = null;

            if (matchState.title) {
                document.getElementById('matchTitleInput').value = matchState.title;
                document.getElementById('matchTitle').textContent = matchState.title;
            }

            if (matchState.homeTeam) {
                document.getElementById('homeTeam').value = matchState.homeTeam;
            }
            if (matchState.awayTeam) {
                document.getElementById('awayTeam').value = matchState.awayTeam;
            }

            if (matchState.homeLogoDataUrl) {
                document.getElementById('homeLogo').innerHTML = 
                    `<img src="${matchState.homeLogoDataUrl}" alt="Logo Domicile" class="logo-img">`;
            }
            if (matchState.awayLogoDataUrl) {
                document.getElementById('awayLogo').innerHTML = 
                    `<img src="${matchState.awayLogoDataUrl}" alt="Logo Visiteur" class="logo-img">`;
            }
        }
    } catch (error) {
        console.warn('Could not load data:', error);
    }
}

function startAutoSave() {
    setInterval(saveLocalData, 10000);
}

// Auto-save on input changes
document.addEventListener('input', function(e) {
    if (e.target.id === 'homeTeam' || e.target.id === 'awayTeam') {
        setTimeout(() => {
            matchState.homeTeam = document.getElementById('homeTeam').value;
            matchState.awayTeam = document.getElementById('awayTeam').value;
            saveLocalData();
        }, 500);
    }
});