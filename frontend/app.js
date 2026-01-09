/**
 * Movie & Series Companion - Frontend Application
 * Handles chat interface, history, recommendations, and quizzes
 */

// ===== Configuration =====
const CONFIG = {
    API_BASE: window.location.origin,
    USER_ID: localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9),
    SESSION_ID: localStorage.getItem('sessionId') || null,
};

// Store user ID
localStorage.setItem('userId', CONFIG.USER_ID);

// ===== State Management =====
const state = {
    currentView: 'chat',
    messages: [],
    history: [],
    recommendations: [],
    currentQuiz: null,
    isLoading: false,
};

// ===== DOM Elements =====
const elements = {
    // Navigation
    navItems: document.querySelectorAll('.nav-item'),
    views: document.querySelectorAll('.view'),

    // Chat
    messagesContainer: document.getElementById('messagesContainer'),
    messageInput: document.getElementById('messageInput'),
    sendButton: document.getElementById('sendButton'),
    quickActions: document.querySelectorAll('.quick-action'),

    // History
    historyGrid: document.getElementById('historyGrid'),
    filterTabs: document.querySelectorAll('.filter-tab'),

    // Discover
    genreChips: document.querySelectorAll('.genre-chip'),
    recommendationsGrid: document.getElementById('recommendationsGrid'),

    // Quiz
    quizContainer: document.getElementById('quizContainer'),
    startQuizBtn: document.getElementById('startQuizBtn'),
    totalQuestions: document.getElementById('totalQuestions'),
    correctAnswers: document.getElementById('correctAnswers'),
    accuracy: document.getElementById('accuracy'),

    // Cards Panel
    cardsPanel: document.getElementById('cardsPanel'),
    cardsContainer: document.getElementById('cardsContainer'),
    closePanel: document.getElementById('closePanel'),

    // Toast
    toastContainer: document.getElementById('toastContainer'),

    // User
    userName: document.getElementById('userName'),
};

// ===== API Functions =====
const api = {
    async chat(message) {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    user_id: CONFIG.USER_ID,
                    session_id: CONFIG.SESSION_ID,
                }),
            });

            const data = await response.json();
            CONFIG.SESSION_ID = data.session_id;
            localStorage.setItem('sessionId', data.session_id);

            return data;
        } catch (error) {
            console.error('Chat API error:', error);
            throw error;
        }
    },

    async getHistory(status = null) {
        try {
            let url = `${CONFIG.API_BASE}/api/history/${CONFIG.USER_ID}`;
            if (status) url += `?status=${status}`;

            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('History API error:', error);
            return { history: [] };
        }
    },

    async getRecommendations(genre = null, mood = null) {
        try {
            let url = `${CONFIG.API_BASE}/api/recommendations/${CONFIG.USER_ID}?count=6`;
            if (genre) url += `&genre=${genre}`;
            if (mood) url += `&mood=${mood}`;

            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Recommendations API error:', error);
            return { recommendations: [] };
        }
    },
};

// ===== View Management =====
function switchView(viewName) {
    state.currentView = viewName;

    // Update nav items
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update views
    elements.views.forEach(view => {
        view.classList.toggle('active', view.id === `${viewName}View`);
    });

    // Load view-specific data
    switch (viewName) {
        case 'history':
            loadHistory();
            break;
        case 'discover':
            loadRecommendations();
            break;
        case 'quiz':
            loadQuizStats();
            break;
    }
}

// ===== Chat Functions =====
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'agent'}`;

    const avatar = isUser ? '👤' : '🎬';

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div class="message-bubble">${formatMessageContent(content)}</div>
        </div>
    `;

    elements.messagesContainer.appendChild(messageDiv);
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;

    // Check for recommendations in the response
    if (!isUser && content.includes('recommend') || content.includes('suggest')) {
        // Could extract and show in side panel
    }
}

function formatMessageContent(content) {
    // Convert markdown-like formatting
    let formatted = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/- (.*?)(?:<br>|$)/g, '<li>$1</li>');

    // Wrap lists
    if (formatted.includes('<li>')) {
        formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    }

    return formatted;
}

function addTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message agent typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="message-avatar">🎬</div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        </div>
    `;
    elements.messagesContainer.appendChild(indicator);
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

async function sendMessage(message) {
    if (!message.trim() || state.isLoading) return;

    state.isLoading = true;
    elements.sendButton.disabled = true;
    elements.messageInput.value = '';
    autoResizeTextarea();

    // Add user message
    addMessage(message, true);

    // Show typing indicator
    addTypingIndicator();

    try {
        const response = await api.chat(message);
        removeTypingIndicator();
        addMessage(response.response || response.message || 'I had trouble understanding that. Could you try again?');

        // Check if we should refresh history
        if (message.toLowerCase().includes('watch') ||
            message.toLowerCase().includes('add') ||
            message.toLowerCase().includes('finished')) {
            setTimeout(() => loadHistory(), 1000);
        }
    } catch (error) {
        removeTypingIndicator();
        addMessage('Sorry, I\'m having trouble connecting right now. Please try again!');
        showToast('Connection Error', 'Could not reach the server', 'error');
    } finally {
        state.isLoading = false;
        updateSendButton();
    }
}

function autoResizeTextarea() {
    const textarea = elements.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function updateSendButton() {
    elements.sendButton.disabled = !elements.messageInput.value.trim() || state.isLoading;
}

// ===== History Functions =====
async function loadHistory(status = null) {
    elements.historyGrid.innerHTML = '<div class="loading-state"><div class="loader"></div><p>Loading your shows...</p></div>';

    try {
        const data = await api.getHistory(status);
        state.history = data.history || [];
        renderHistory();
    } catch (error) {
        elements.historyGrid.innerHTML = '<div class="empty-state"><span class="empty-icon">⚠️</span><h3>Could not load history</h3></div>';
    }
}

function renderHistory() {
    if (state.history.length === 0) {
        elements.historyGrid.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📚</span>
                <h3>No shows yet</h3>
                <p>Start chatting to add shows to your history!</p>
            </div>
        `;
        return;
    }

    elements.historyGrid.innerHTML = state.history.map(show => `
        <div class="show-card" data-title="${show.title}">
            <div class="show-poster">
                ${show.poster_url
            ? `<img src="${show.poster_url}" alt="${show.title}">`
            : (show.type === 'movie' ? '🎬' : '📺')
        }
                <div class="show-overlay"></div>
            </div>
            <div class="show-info">
                <div class="show-title">${show.title}</div>
                <div class="show-meta">
                    <span class="show-status ${show.status}">${show.status}</span>
                    ${show.rating ? `<span>⭐ ${show.rating}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// ===== Recommendations Functions =====
async function loadRecommendations(genre = null) {
    elements.recommendationsGrid.innerHTML = '<div class="loading-state"><div class="loader"></div><p>Finding great shows for you...</p></div>';

    try {
        const data = await api.getRecommendations(genre);
        state.recommendations = data.recommendations || [];
        renderRecommendations();
    } catch (error) {
        elements.recommendationsGrid.innerHTML = '<div class="empty-state"><span class="empty-icon">⚠️</span><h3>Could not load recommendations</h3></div>';
    }
}

function renderRecommendations() {
    if (state.recommendations.length === 0) {
        elements.recommendationsGrid.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🔍</span>
                <h3>No recommendations yet</h3>
                <p>Tell me about some shows you like to get started!</p>
            </div>
        `;
        return;
    }

    elements.recommendationsGrid.innerHTML = state.recommendations.map(rec => `
        <div class="recommendation-card" data-title="${rec.title}">
            <div class="recommendation-poster">
                ${rec.poster_url
            ? `<img src="${rec.poster_url}" alt="${rec.title}">`
            : (rec.type === 'movie' ? '🎬' : '📺')
        }
                ${rec.rating ? `<span class="recommendation-rating">⭐ ${rec.rating.toFixed(1)}</span>` : ''}
            </div>
            <div class="recommendation-body">
                <div class="recommendation-title">${rec.title}</div>
                <div class="recommendation-year">${rec.type === 'movie' ? '🎬 Movie' : '📺 Series'}${rec.year ? ` • ${rec.year}` : ''}</div>
                <p class="recommendation-overview">${rec.overview || 'No description available'}</p>
                <div class="recommendation-actions">
                    <button class="btn-add" onclick="addToWatchlist('${rec.title.replace(/'/g, "\\'")}')">➕ Add</button>
                    <button class="btn-reject" onclick="rejectRecommendation('${rec.title.replace(/'/g, "\\'")}')">✕ Not interested</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function addToWatchlist(title) {
    showToast('Adding to watchlist', title, 'success');
    await api.chat(`Add ${title} to my watchlist`);
    loadRecommendations(); // Refresh
}

async function rejectRecommendation(title) {
    showToast('Noted', `I won't suggest ${title} again`, 'success');
    await api.chat(`I'm not interested in ${title}`);
    loadRecommendations(); // Refresh
}

// ===== Quiz Functions =====
function loadQuizStats() {
    // Would load from API in production
    elements.totalQuestions.textContent = '0';
    elements.correctAnswers.textContent = '0';
    elements.accuracy.textContent = '0%';
}

async function startQuiz() {
    elements.quizContainer.innerHTML = '<div class="loading-state"><div class="loader"></div><p>Preparing your quiz...</p></div>';

    try {
        const response = await api.chat("Let's play a quiz!");

        // Parse the response for quiz data
        elements.quizContainer.innerHTML = `
            <div class="quiz-question">
                <span class="quiz-question-type">🧠 Trivia</span>
                <p class="quiz-question-text">${formatMessageContent(response.response)}</p>
                <input type="text" class="quiz-input" id="quizAnswer" placeholder="Type your answer...">
                <p class="quiz-hint">💡 Hint: Think about your watched shows!</p>
                <div class="quiz-actions">
                    <button class="btn-secondary" onclick="skipQuestion()">Skip</button>
                    <button class="btn-primary" onclick="submitAnswer()">Submit Answer</button>
                </div>
            </div>
        `;
    } catch (error) {
        elements.quizContainer.innerHTML = `
            <div class="quiz-start">
                <div class="quiz-icon">😅</div>
                <h2>Oops!</h2>
                <p>Couldn't start the quiz. Try again!</p>
                <button class="btn-primary" onclick="startQuiz()">Retry</button>
            </div>
        `;
    }
}

async function submitAnswer() {
    const answer = document.getElementById('quizAnswer')?.value;
    if (!answer) return;

    try {
        const response = await api.chat(answer);
        showToast('Quiz', formatMessageContent(response.response).substring(0, 100), 'success');

        // Continue with next question
        setTimeout(startQuiz, 2000);
    } catch (error) {
        showToast('Error', 'Could not submit answer', 'error');
    }
}

function skipQuestion() {
    startQuiz();
}

// ===== Toast Notifications =====
function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✅' : '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===== Cards Panel =====
function showCardsPanel(cards) {
    elements.cardsContainer.innerHTML = cards.map(card => `
        <div class="content-card">
            <div class="card-image">
                ${card.poster_url
            ? `<img src="${card.poster_url}" alt="${card.title}">`
            : '🎬'
        }
            </div>
            <div class="card-body">
                <div class="card-title">${card.title}</div>
                <div class="card-subtitle">${card.year || ''} • ${card.type}</div>
                <p class="card-description">${card.overview || ''}</p>
            </div>
        </div>
    `).join('');

    elements.cardsPanel.classList.add('open');
}

function hideCardsPanel() {
    elements.cardsPanel.classList.remove('open');
}

// ===== Event Listeners =====
function initEventListeners() {
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    // Chat input
    elements.messageInput.addEventListener('input', () => {
        autoResizeTextarea();
        updateSendButton();
    });

    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(elements.messageInput.value);
        }
    });

    elements.sendButton.addEventListener('click', () => {
        sendMessage(elements.messageInput.value);
    });

    // Quick actions
    elements.quickActions.forEach(action => {
        action.addEventListener('click', () => {
            sendMessage(action.dataset.prompt);
        });
    });

    // History filter tabs
    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.dataset.filter === 'all' ? null : tab.dataset.filter;
            loadHistory(filter);
        });
    });

    // Genre chips
    elements.genreChips.forEach(chip => {
        chip.addEventListener('click', () => {
            elements.genreChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            loadRecommendations(chip.dataset.genre);
        });
    });

    // Quiz
    if (elements.startQuizBtn) {
        elements.startQuizBtn.addEventListener('click', startQuiz);
    }

    // Cards panel
    elements.closePanel.addEventListener('click', hideCardsPanel);
}

// ===== Typing Indicator Styles =====
const typingStyles = document.createElement('style');
typingStyles.textContent = `
    .typing-dots {
        display: flex;
        gap: 6px;
        padding: 4px 0;
    }
    
    .typing-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent-secondary);
        animation: typingBounce 1.4s ease-in-out infinite;
    }
    
    .typing-dots span:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .typing-dots span:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes typingBounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-8px); }
    }
`;
document.head.appendChild(typingStyles);

// ===== Initialize =====
function init() {
    console.log('🎬 Movie & Series Companion initialized');
    console.log(`User ID: ${CONFIG.USER_ID}`);

    initEventListeners();

    // Set user name display
    if (elements.userName) {
        elements.userName.textContent = `User ${CONFIG.USER_ID.slice(-6)}`;
    }

    // Focus input
    elements.messageInput?.focus();
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Make functions globally accessible for onclick handlers
window.addToWatchlist = addToWatchlist;
window.rejectRecommendation = rejectRecommendation;
window.startQuiz = startQuiz;
window.submitAnswer = submitAnswer;
window.skipQuestion = skipQuestion;
