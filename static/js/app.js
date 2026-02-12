// --- State Management ---
// We will replace localStorage with API calls.

let categories = [];
let cards = [];
let gameState = {
    selectedCategories: [],
    shuffled: [],
    currentIndex: 0,
    success: 0,
    fail: 0
};

// --- DOM Elements ---
const views = document.querySelectorAll('.view');
const startGameBtn = document.getElementById('start-game-btn');

// --- Helper: CSRF Token ---
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
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
    if (viewId === 'setup') renderGameSetup();

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
    } else {
        emptyState.style.display = 'none';
        libraryState.style.display = 'block';
        startGameBtn.disabled = false;

        cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'mini-card';

            // Find category name
            const cat = categories.find(c => c.id === card.category_id);
            const catName = cat ? cat.name : 'Sin Categoría';

            cardEl.innerHTML = `
                <button class="delete-card" onclick="deleteCard(${card.id})">×</button>
                <h3>${catName}</h3>
                <p><strong>F:</strong> ${card.front}</p>
                <p><strong>R:</strong> ${card.back}</p>
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
        item.style.textAlign = 'center';
        item.innerHTML = `
            <h3>${cat.name}</h3> 
            <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="deleteCategory(${cat.id})">Eliminar</button>
        `; // TODO: Edit
        list.appendChild(item);
    });
}

function renderGameSetup() {
    const list = document.getElementById('setup-categories-list');
    list.innerHTML = '';

    if (categories.length === 0) {
        list.innerHTML = '<p>No hay categorías</p>';
        return;
    }

    categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'setup-cat-item';
        item.style.padding = '1rem';
        item.style.borderRadius = '15px';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '1rem';
        item.style.background = 'white';
        item.style.marginBottom = '1rem';

        item.innerHTML = `
            <input type="checkbox" id="setup-cat-${cat.id}" value="${cat.id}" checked>
            <label for="setup-cat-${cat.id}" style="font-weight: 600; cursor: pointer; flex: 1;">${cat.name}</label>
        `;
        list.appendChild(item);
    });
}

// --- Actions (API) ---

async function saveCategory() {
    const nameInput = document.getElementById('cat-name-input');
    const name = nameInput.value.trim();
    if (!name) return showToast('¡El nombre no puede estar vacío! 😿', true);

    try {
        const res = await fetch('/api/categories/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ name })
        });

        if (res.ok) {
            showToast('Categoría creada ✨');
            nameInput.value = '';
            loadCategories();
        } else {
            showToast('Error al crear categoría', true);
        }
    } catch (e) {
        console.error(e);
        showToast('Error de conexión', true);
    }
}

async function deleteCategory(id) {
    if (!confirm('¿Seguro que quieres borrar esta categoría? Se borrarán sus cartas.')) return;

    try {
        const res = await fetch(`/api/categories/${id}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrftoken
            }
        });
        if (res.ok) {
            loadCategories();
        }
    } catch (e) {
        console.error(e);
    }
}


function prepareEditCard() {
    showView('add');
    const select = document.getElementById('card-category');
    select.innerHTML = '';

    // Fetch categories if empty?
    // Assume loaded
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        select.appendChild(opt);
    });
}

async function saveCard() {
    const catId = document.getElementById('card-category').value;
    const front = document.getElementById('card-front').value.trim();
    const back = document.getElementById('card-back').value.trim();

    if (!catId || !front || !back) {
        return showToast('¡Faltan datos! 😿', true);
    }

    try {
        const res = await fetch('/api/cards/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ category_id: catId, front, back })
        });

        if (res.ok) {
            showToast('¡Tarjeta guardada con éxito! 🐾');
            document.getElementById('card-front').value = '';
            document.getElementById('card-back').value = '';
            // document.getElementById('card-front').focus();
        } else {
            showToast('Error al guardar tarjeta', true);
        }

    } catch (e) {
        console.error(e);
        showToast('Error de conexión', true);
    }
}

async function deleteCard(id) {
    if (!confirm('¿Borrar tarjeta?')) return;
    try {
        const res = await fetch(`/api/cards/${id}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrftoken
            }
        });
        if (res.ok) {
            loadLibrary();
        }
    } catch (e) {
        console.error(e);
    }
}


// --- Game Logic ---
function startGameFromSetup() {
    const checkboxes = document.querySelectorAll('#setup-categories-list input[type="checkbox"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (selectedIds.length === 0) return showToast('¡Selecciona al menos una categoría!', true);

    // Filter cards
    const gameCards = cards.filter(c => selectedIds.includes(c.category_id));

    if (gameCards.length === 0) return showToast('Estas categorías no tienen tarjetas 😿', true);

    gameState.shuffled = gameCards.sort(() => Math.random() - 0.5);
    gameState.currentIndex = 0;
    gameState.success = 0;
    gameState.fail = 0;

    updateGameStats();
    showCard();
    showView('game');
}

function showCard() {
    const card = gameState.shuffled[gameState.currentIndex];
    const flipCard = document.getElementById('main-flip-card');
    flipCard.classList.remove('flipped');
    document.getElementById('game-controls').classList.remove('show');

    setTimeout(() => {
        document.getElementById('game-front').textContent = card.front;
        document.getElementById('game-back').textContent = card.back;
    }, 200);
}

document.getElementById('main-flip-card').addEventListener('click', function () {
    this.classList.toggle('flipped');
    if (this.classList.contains('flipped')) {
        setTimeout(() => {
            document.getElementById('game-controls').classList.add('show');
        }, 300);
    }
});

function handleGameAnswer(isSuccess) {
    if (isSuccess) gameState.success++;
    else gameState.fail++;

    gameState.currentIndex++;
    updateGameStats();

    if (gameState.currentIndex >= gameState.shuffled.length) {
        finishGame();
    } else {
        showCard();
    }
}

function updateGameStats() {
    document.getElementById('current-card-idx').textContent = gameState.currentIndex + 1;
    document.getElementById('success-count').textContent = gameState.success;
    document.getElementById('fail-count').textContent = gameState.fail;
}

async function finishGame() {
    document.getElementById('final-success').textContent = gameState.success;
    document.getElementById('final-fail').textContent = gameState.fail;
    showView('results');

    // Save stats
    try {
        await fetch('/api/stats/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                total: gameState.shuffled.length,
                success: gameState.success,
                fail: gameState.fail,
                duration: 60 // Fake duration for now
            })
        });
    } catch (e) {
        console.error('Error saving stats', e);
    }
}

function updateGameStats() {
    document.getElementById('current-card-idx').textContent = gameState.currentIndex + 1;
    document.getElementById('success-count').textContent = gameState.success;
    document.getElementById('fail-count').textContent = gameState.fail;
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    // Nav listeners
    document.getElementById('nav-home').addEventListener('click', () => showView('home'));

    // Add logic
    document.getElementById('nav-add').addEventListener('click', () => prepareEditCard());

    // Initial Load
    showView('home');
});
