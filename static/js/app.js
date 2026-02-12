// --- State Management ---
// Replacing LocalStorage with Django API

let categories = [];
let cards = [];
// --- Configuration ---
const DAILY_MESSAGES = [
    {
        title: "Para la niña del pelo radiante 🔥",
        body: "Sé que tienes metas grandes y la inteligencia para alcanzarlas. ¡Dale con todo hoy! ✨"
    },
    {
        title: "Un pequeño recordatorio 🍎",
        body: "Incluso las mentes más brillantes necesitan una pausa. Camina un poco y toma aire, te lo mereces. 🌿"
    },
    {
        title: "Tu fan número uno 📣",
        body: "Me encanta ver cómo te esfuerzas por lo que quieres. ¡Eres pura chispa y determinación! 🔥"
    },
    {
        title: "Respiración profunda 🌬️",
        body: "Si el estudio se pone pesado, recuerda que yo confío en ti plenamente. ¡Tú puedes con esto y más! 💪"
    },
    {
        title: "Un detalle para ti 🎨",
        body: "Eres increíble. Que cada carta que repases hoy te acerque a tus sueños. Estaré apoyándote. ❤️"
    },
    {
        title: "Misión del día 🚀",
        body: "Conquista esos libros como la mujer valiente que eres. ¡Acuérdate de brillar! ✨"
    },
    {
        title: "Energía positiva ⚡",
        body: "Si te sientes cansada, cierra los ojos un minuto y recuerda por qué empezaste. ¡Yo creo en ti!"
    },
    {
        title: "Un break necesario ☕",
        body: "Incluso las supermujeres necesitan recargar baterías. ¿Ya tomaste agüita hoy? 💧"
    },
    {
        title: "Para la pelirroja con más chispa 🎇",
        body: "Tu determinación brilla más que cualquier pantalla. ¡A darle con todo a esos apuntes!"
    },
    {
        title: "Check de postura 🧘‍♀️",
        body: "Endereza la espalda, respira hondo y sigue conquistando el mundo (o al menos esa materia). 😉"
    },
    {
        title: "Orgulloso de ti 🌟",
        body: "No dejes que una carta difícil te detenga. Eres más capaz de lo que imaginas. ¡Dale!"
    },
    {
        title: "Un rayito de sol ☀️",
        body: "Espero que este mensaje te saque una sonrisa antes de seguir estudiando. ¡Te lo mereces!"
    },
    {
        title: "Mente clara, corazón valiente 🦁",
        body: "Estudiar es un maratón, no un sprint. Mantén tu ritmo, que la meta está cada vez más cerca."
    },
    {
        title: "La magia del esfuerzo ✨",
        body: "Cada minuto que inviertes hoy es una puerta que se abre mañana. ¡No pares!"
    },
    {
        title: "Pequeños pasos, grandes saltos 👣",
        body: "Quizás hoy parezca mucho, pero mañana verás que valió la pena. ¡Ánimo!"
    },
    {
        title: "Nota mental 📝",
        body: "Eres talentosa, eres dedicada y, sobre todo, eres increíble. Nunca lo olvides."
    },
    {
        title: "Desconexión 🔌",
        body: "Si la cabeza te da vueltas, tómate 5 minutos. El conocimiento se queda mejor en una mente descansada."
    }
];

let gameState = {
    shuffled: [],
    currentIndex: 0,
    success: 0,
    fail: 0,
    startTime: null
};

// --- DOM Elements ---
const views = document.querySelectorAll('.view');
const startGameBtn = document.getElementById('start-game-btn');
const mainFlipCard = document.getElementById('main-flip-card');
const categorySelect = document.getElementById('card-category');

// --- Helper: CSRF Token ---
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');


// --- Helper: Toasts ---
function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.borderColor = isError ? 'var(--danger)' : 'var(--primary-pink)';
    toast.style.color = isError ? 'var(--danger)' : 'var(--primary-pink)';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- Navigation ---
function showView(viewId) {
    views.forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
        target.classList.add('active');
    }

    if (viewId === 'home') loadLibrary();
    if (viewId === 'categories') loadCategories();
    // if (viewId === 'setup') renderGameSetup(); // Called by button

    window.scrollTo(0, 0);
}

// --- Data Loading (API) ---
async function fetchCategories() {
    try {
        const response = await fetch('/api/categories/');
        categories = await response.json();
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function fetchCards() {
    try {
        const response = await fetch('/api/cards/');
        cards = await response.json();
    } catch (error) {
        console.error('Error fetching cards:', error);
    }
}

async function loadLibrary() {
    // Parallel fetch
    await Promise.all([fetchCategories(), fetchCards()]);
    renderLibrary();
}

async function loadCategories() {
    await fetchCategories();
    renderCategories();
}


// --- Rendering ---
function renderLibrary() {
    const container = document.getElementById('cards-grid');
    const emptyState = document.getElementById('empty-container');
    const libraryState = document.getElementById('library-container');

    container.innerHTML = '';

    if (cards.length === 0) {
        emptyState.style.display = 'block';
        libraryState.style.display = 'none';
        startGameBtn.disabled = true;
        return;
    }

    emptyState.style.display = 'none';
    libraryState.style.display = 'block';
    startGameBtn.disabled = false;

    // Group by Category (Logic from principal.html)
    const cardsByCat = {};
    // Initialize buckets for known categories
    categories.forEach(cat => cardsByCat[cat.id] = []);
    // Also handle unknown/deleted categories bucket
    cardsByCat['unknown'] = [];

    cards.forEach(card => {
        const catId = card.category_id;
        if (cardsByCat[catId]) {
            cardsByCat[catId].push(card);
        } else {
            cardsByCat['unknown'].push(card);
        }
    });

    // Render Groups
    for (const catId in cardsByCat) {
        const groupCards = cardsByCat[catId];
        if (groupCards.length === 0) continue;

        let categoryName = 'Sin Categoría 🕵️‍♀️';
        if (catId !== 'unknown') {
            const cat = categories.find(c => c.id == catId);
            if (cat) categoryName = cat.name;
        }

        // Header
        const groupTitle = document.createElement('h3');
        groupTitle.style.gridColumn = '1 / -1';
        groupTitle.style.marginTop = '1rem';
        groupTitle.style.color = 'var(--text-dim)';
        groupTitle.style.borderBottom = '2px dashed var(--medical-green)';
        groupTitle.style.paddingBottom = '0.5rem';
        groupTitle.textContent = categoryName;
        container.appendChild(groupTitle);

        // Cards
        groupCards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'mini-card';
            cardEl.innerHTML = `
                <div style="position:absolute; top:10px; right:10px; display:flex; gap:0.3rem">
                    <button class="delete-card" style="position:static; width:30px; height:30px; background:#e0f7fa; color:var(--medical-blue); border-color:var(--medical-blue)" onclick="prepareEditCard(${card.id})">✏️</button>
                    <button class="delete-card" style="position:static; width:30px; height:30px;" onclick="deleteCard(${card.id})">×</button>
                </div>
                <div style="font-size: 0.8rem; color: var(--medical-blue); margin-bottom: 0.3rem;">📋 Registro #${card.id}</div>
                <h3>${card.front}</h3>
                <p>${card.back.substring(0, 100)}${card.back.length > 100 ? '...' : ''}</p>
            `;
            container.appendChild(cardEl);
        });
    }
}

function renderCategories() {
    const list = document.getElementById('categories-list');
    list.innerHTML = '';

    categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'mini-card';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';

        item.innerHTML = `
            <h3 style="margin:0">${cat.name}</h3>
            <div style="display:flex; gap:0.5rem">
                <button class="btn" style="padding: 0.3rem 0.6rem; font-size:0.8rem" onclick="editCategory(${cat.id})">✏️</button>
                <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size:0.8rem" onclick="deleteCategory(${cat.id})">🗑️</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderGameSetup() {
    const container = document.getElementById('setup-categories-list');
    container.innerHTML = '';

    if (categories.length === 0) {
        container.innerHTML = '<p>No hay categorías</p>';
        return;
    }

    // Checkbox for "All"
    const allDiv = document.createElement('div');
    allDiv.className = 'mini-card';
    allDiv.style.cursor = 'pointer';
    allDiv.style.display = 'flex';
    allDiv.style.alignItems = 'center';
    allDiv.style.gap = '1rem';
    allDiv.style.background = '#eef';
    allDiv.innerHTML = `
        <input type="checkbox" id="setup-cat-all" style="transform: scale(1.5);">
        <h3 style="margin:0">Seleccionar Todo 🌍</h3>
    `;
    allDiv.onclick = (e) => {
        if (e.target.tagName !== 'INPUT') {
            const cb = document.getElementById('setup-cat-all');
            cb.checked = !cb.checked;
            toggleAllCats(cb.checked);
        } else {
            toggleAllCats(e.target.checked);
        }
    };
    container.appendChild(allDiv);

    // Individual Categories
    categories.forEach(cat => {
        // Count cards in this category
        const count = cards.filter(c => c.category_id === cat.id).length;
        if (count === 0) return;

        const div = document.createElement('div');
        div.className = 'mini-card setup-cat-item';
        div.setAttribute('data-id', cat.id);
        div.style.cursor = 'pointer';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:1rem">
                <input type="checkbox" class="setup-cb" value="${cat.id}" style="transform: scale(1.5);">
                <h3 style="margin:0">${cat.name}</h3>
            </div>
            <span style="background:var(--secondary-pink); color:white; padding:0.2rem 0.6rem; border-radius:20px; font-size:0.8rem">${count} cartas</span>
        `;
        div.onclick = (e) => {
            if (e.target.tagName !== 'INPUT') {
                const cb = div.querySelector('input');
                cb.checked = !cb.checked;
            }
        };
        container.appendChild(div);
    });
}

function toggleAllCats(checked) {
    document.querySelectorAll('.setup-cb').forEach(cb => cb.checked = checked);
}

// --- Category Logic ---

async function saveCategory() {
    const nameInput = document.getElementById('cat-name-input');
    const name = nameInput.value.trim();
    if (!name) return showToast('¡El nombre no puede estar vacío! 😿', true);

    const editingId = nameInput.dataset.editingId;

    try {
        if (editingId) {
            // Update
            const res = await fetch(`/api/categories/${editingId}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                showToast('Categoría actualizada 📝');
                delete nameInput.dataset.editingId;
                document.getElementById('btn-save-cat').textContent = '✨ Crear Categoría';
            }
        } else {
            // Create
            const res = await fetch('/api/categories/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
                body: JSON.stringify({ name })
            });
            if (res.ok) showToast('Categoría creada ✨');
        }
        nameInput.value = '';
        loadCategories();

    } catch (e) {
        console.error(e);
        showToast('Error de conexión', true);
    }
}

function editCategory(id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    const input = document.getElementById('cat-name-input');
    input.value = cat.name;
    input.dataset.editingId = id;
    document.getElementById('btn-save-cat').innerHTML = '💾 Guardar Cambios';
    window.scrollTo(0, 0);
}

async function deleteCategory(id) {
    if (!confirm('¿Seguro que quieres borrar esta categoría? Se borrarán sus cartas.')) return;
    try {
        const res = await fetch(`/api/categories/${id}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': csrftoken }
        });
        if (res.ok) {
            loadCategories();
            showToast('Categoría eliminada 🗑️');
        }
    } catch (e) {
        console.error(e);
    }
}

// --- Card Logic ---

let editingCardId = null;

function prepareEditCard(id = null) {
    editingCardId = id;
    // ensure categories are loaded before showing dropdown
    if (categories.length === 0) {
        // Fallback or force fetch?
        // We assume they are loaded because we are in the app.
        // But if empty, warn?
    }

    showView('add');
    const select = document.getElementById('card-category');
    select.innerHTML = '';

    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        select.appendChild(opt);
    });

    const frontInput = document.getElementById('card-front');
    const backInput = document.getElementById('card-back');

    if (id) {
        const card = cards.find(c => c.id === id);
        if (card) {
            frontInput.value = card.front;
            backInput.value = card.back;
            select.value = card.category_id;
            document.getElementById('form-title').textContent = '✏️ Editar Tarjeta';
        }
    } else {
        frontInput.value = '';
        backInput.value = '';
        if (categories.length > 0) select.value = categories[0].id;
        document.getElementById('form-title').textContent = '🍎 Nueva Tarjeta';
    }
}

async function saveCard() {
    const catId = document.getElementById('card-category').value;
    const front = document.getElementById('card-front').value.trim();
    const back = document.getElementById('card-back').value.trim();

    if (!front || !back) {
        return showToast('¡Ay! Faltan datos en la receta 🩺', true);
    }

    try {
        if (editingCardId) {
            // Update
            const res = await fetch(`/api/cards/${editingCardId}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
                body: JSON.stringify({ category_id: catId, front, back })
            });
            if (res.ok) showToast('Tarjeta actualizada 📝');

        } else {
            // Create
            const res = await fetch('/api/cards/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
                body: JSON.stringify({ category_id: catId, front, back })
            });
            if (res.ok) showToast('¡Tarjeta guardada! 🐾');
        }

        loadLibrary();
        showView('home');

    } catch (e) {
        console.error(e);
        showToast('Error de conexión', true);
    }
}

async function deleteCard(id) {
    if (!confirm('¿Deseas eliminar este registro médico? 😿')) return;
    try {
        const res = await fetch(`/api/cards/${id}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': csrftoken }
        });
        if (res.ok) {
            loadLibrary();
            showToast('Registro eliminado 🗑️');
        }
    } catch (e) {
        console.error(e);
    }
}


// --- Game Logic ---
function startGameFromSetup() {
    const selectedIds = Array.from(document.querySelectorAll('.setup-cb:checked')).map(cb => parseInt(cb.value));
    if (selectedIds.length === 0) return showToast('¡Debes elegir al menos una categoría! 😼', true);

    const cardsToPlay = cards.filter(c => selectedIds.includes(c.category_id));
    initGame(cardsToPlay);
}

function initGame(gameCards) {
    if (!gameCards || gameCards.length === 0) return showToast('No hay cartas para jugar', true);

    gameState.shuffled = [...gameCards].sort(() => Math.random() - 0.5);
    gameState.currentIndex = 0;
    gameState.success = 0;
    gameState.fail = 0;
    gameState.startTime = new Date().toISOString();

    updateGameUI();
    showView('game');
}

function updateGameUI() {
    const card = gameState.shuffled[gameState.currentIndex];

    // Safety check if game over logic failed or array is empty
    if (!card) return;

    const frontEl = document.getElementById('game-front');
    const backEl = document.getElementById('game-back');

    if (mainFlipCard) mainFlipCard.classList.remove('flipped');
    document.getElementById('game-controls').classList.remove('show');

    frontEl.textContent = card.front;
    backEl.textContent = card.back;

    document.getElementById('current-card-idx').textContent = `${gameState.currentIndex + 1}/${gameState.shuffled.length}`;
    document.getElementById('success-count').textContent = gameState.success;
    document.getElementById('fail-count').textContent = gameState.fail;
}

if (mainFlipCard) {
    mainFlipCard.addEventListener('click', () => {
        mainFlipCard.classList.toggle('flipped');
        if (mainFlipCard.classList.contains('flipped')) {
            document.getElementById('game-controls').classList.add('show');
        }
    });
}

function handleGameAnswer(isCorrect) {
    if (isCorrect) gameState.success++;
    else gameState.fail++;

    gameState.currentIndex++;

    if (gameState.currentIndex < gameState.shuffled.length) {
        updateGameUI();
    } else {
        finishGame();
    }
}

async function finishGame() {
    const total = gameState.success + gameState.fail;
    const successRate = total === 0 ? 0 : (gameState.success / total);

    document.getElementById('final-success').textContent = gameState.success;
    document.getElementById('final-fail').textContent = gameState.fail;

    const titleObj = document.querySelector('#view-results h2');
    const msgObj = document.querySelector('#view-results p');
    const emojiObj = document.querySelector('#view-results div[style*="font-size: 4rem"]');

    if (gameState.fail === 0 && total > 0) {
        // Perfect Score
        emojiObj.textContent = '🏆';
        titleObj.textContent = 'EXCELENTE! 🌟';
        titleObj.style.color = 'var(--success)';
        msgObj.textContent = '¡Eres la mejor!, te adoro. 😻';
    } else if (successRate < 0.5) {
        // High Failure Rate (< 50%)
        emojiObj.textContent = '🩹';
        titleObj.textContent = '¡Ánimo Anto! ❤️‍🩹';
        titleObj.style.color = 'var(--text-main)';
        msgObj.textContent = 'No te desanimes. ¡Vuelve a intentarlo!';
    } else {
        // Normal
        emojiObj.textContent = '🎉';
        titleObj.textContent = '¡Muy bien!';
        titleObj.style.color = 'var(--primary-pink)';
        msgObj.innerHTML = 'Has completado tu ronda de estudio.<br>Sigue así bb uwu.';
    }

    showView('results');

    // Save stats
    try {
        await fetch('/api/stats/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrftoken },
            body: JSON.stringify({
                total: total,
                success: gameState.success,
                fail: gameState.fail,
                start_time: gameState.startTime,
                end_time: new Date().toISOString()
            })
        });
    } catch (e) {
        console.error('Error saving stats', e);
    }
}

// --- Daily Popup Logic ---
function checkDailyPopup() {
    const lastPopup = localStorage.getItem('lastDailyPopup');
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!lastPopup || (now - parseInt(lastPopup)) > oneDay) {
        showDailyPopup();
        localStorage.setItem('lastDailyPopup', now.toString());
    }
}

function showDailyPopup() {
    const msg = DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)];
    const modal = document.createElement('div');
    modal.className = 'daily-modal-overlay';
    modal.innerHTML = `
        <div class="daily-modal">
            <div style="font-size: 3rem;">✨</div>
            <h2>${msg.title}</h2>
            <p>${msg.body}</p>
            <p>Con cariño, Jorge ❤️</p>
            <button class="btn btn-purple" onclick="this.closest('.daily-modal-overlay').remove()">¡Gracias! 😻</button>
        </div>
    `;
    document.body.appendChild(modal);
}


// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    // Nav listeners
    document.getElementById('nav-home').addEventListener('click', () => showView('home'));
    document.getElementById('nav-add').addEventListener('click', () => prepareEditCard());

    // Explicitly add setup button listener if not in HTML onclick
    const startGame = document.getElementById('start-game-btn');
    if (startGame) {
        startGame.addEventListener('click', () => {
            renderGameSetup();
            showView('setup');
        });
    } else {
        console.warn('start-game-btn not found');
    }

    // Initial Load
    showView('home');
    checkDailyPopup();
});
