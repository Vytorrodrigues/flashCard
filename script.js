const STORAGE_KEY = 'flashstudy_groups';

let groups = {};
let currentGroupName = '';
let currentIndex = 0;
let isFlipped = false;

const flashcard = document.getElementById('flashcard');
const questionText = document.getElementById('question-text');
const answerText = document.getElementById('answer-text');
const cardCounter = document.getElementById('card-counter');
const progressFill = document.getElementById('progress-fill');
const progressPercent = document.getElementById('progress-percent');
const groupNameDisplay = document.getElementById('group-name-display');
const groupSelector = document.getElementById('groupSelector');
const toast = document.getElementById('toast');

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            groups = JSON.parse(stored);
            if (typeof groups !== 'object' || Array.isArray(groups)) throw new Error();
            for (const key in groups) {
                if (!Array.isArray(groups[key])) groups[key] = [];
            }
        } catch {
            groups = getDefaultGroups();
        }
    } else {
        groups = getDefaultGroups();
    }
    saveData();
}

function getDefaultGroups() {
    return {
        'HTML/CSS': [
            { question: 'O que é HTML?', answer: 'Linguagem de marcação para estruturar páginas web.' },
            { question: 'O que é CSS?', answer: 'Linguagem de estilo para definir a aparência das páginas.' }
        ],
        'JavaScript': [
            { question: 'O que é JavaScript?', answer: 'Linguagem de programação para interatividade no navegador.' },
            { question: 'O que é uma API?', answer: 'Interface que permite comunicação entre sistemas.' }
        ],
        'Banco de Dados': [
            { question: 'O que é SQL?', answer: 'Linguagem para gerenciar bancos de dados relacionais.' },
            { question: 'O que é JSON?', answer: 'Formato leve de troca de dados.' }
        ]
    };
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

function getCurrentCards() {
    if (!groups[currentGroupName]) {
        groups[currentGroupName] = [];
        saveData();
    }
    return groups[currentGroupName];
}

function getGroupNames() {
    return Object.keys(groups).sort();
}

function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.style.borderColor = isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(167, 139, 250, 0.2)';
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

function renderGroupSelector() {
    const names = getGroupNames();
    groupSelector.innerHTML = '';
    if (names.length === 0) {
        const msg = document.createElement('span');
        msg.textContent = 'Nenhum grupo. Crie um!';
        msg.style.color = '#8888aa';
        msg.style.fontSize = '0.9rem';
        groupSelector.appendChild(msg);
        return;
    }
    names.forEach(name => {
        const btn = document.createElement('button');
        btn.textContent = name;
        const count = groups[name] ? groups[name].length : 0;
        const span = document.createElement('span');
        span.className = 'group-cards-count';
        span.textContent = `(${count})`;
        btn.appendChild(span);
        if (name === currentGroupName) btn.classList.add('active');
        btn.addEventListener('click', () => switchGroup(name));

        const delBtn = document.createElement('button');
        delBtn.textContent = '✕';
        delBtn.className = 'delete-group-btn';
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteGroup(name);
        });

        const wrapper = document.createElement('span');
        wrapper.style.display = 'inline-flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '4px';
        wrapper.appendChild(btn);
        wrapper.appendChild(delBtn);
        groupSelector.appendChild(wrapper);
    });
}

function renderCard() {
    const cards = getCurrentCards();
    if (!cards || cards.length === 0) {
        questionText.textContent = 'Nenhum flashcard neste grupo.';
        answerText.textContent = 'Adicione um!';
        cardCounter.textContent = '0 / 0';
        progressFill.style.width = '0%';
        progressPercent.textContent = '0%';
        groupNameDisplay.textContent = currentGroupName ? `📁 ${currentGroupName}` : '';
        return;
    }
    if (currentIndex >= cards.length) currentIndex = cards.length - 1;
    if (currentIndex < 0) currentIndex = 0;

    const card = cards[currentIndex];
    questionText.textContent = card.question;
    answerText.textContent = card.answer;

    cardCounter.textContent = `${currentIndex + 1} / ${cards.length}`;
    const pct = Math.round(((currentIndex + 1) / cards.length) * 100);
    progressFill.style.width = `${pct}%`;
    progressPercent.textContent = `${pct}%`;
    groupNameDisplay.textContent = currentGroupName ? `📁 ${currentGroupName}` : '';

    if (isFlipped) {
        flashcard.classList.remove('flipped');
        isFlipped = false;
    }
}

function switchGroup(name) {
    if (!groups[name]) { groups[name] = []; saveData(); }
    currentGroupName = name;
    currentIndex = 0;
    renderGroupSelector();
    renderCard();
    showToast(`Grupo: ${name}`);
}

function createGroup(name) {
    const trimmed = name.trim();
    if (!trimmed) { showToast('Digite um nome para o grupo.', true); return; }
    if (groups[trimmed]) { showToast('Grupo já existe!', true); return; }
    groups[trimmed] = [];
    saveData();
    switchGroup(trimmed);
    document.getElementById('newGroupName').value = '';
    showToast(`Grupo "${trimmed}" criado! ✅`);
}

function deleteGroup(name) {
    if (!groups[name]) return;
    const count = groups[name].length;
    if (!confirm(`Deletar o grupo "${name}" com ${count} cards?`)) return;
    delete groups[name];
    saveData();
    const names = getGroupNames();
    if (names.length > 0) switchGroup(names[0]);
    else { currentGroupName = ''; currentIndex = 0; renderGroupSelector(); renderCard(); }
    showToast(`Grupo "${name}" deletado.`);
}

function deleteAllCardsInGroup() {
    const cards = getCurrentCards();
    if (!cards || cards.length === 0) { showToast('Nenhum card neste grupo.', true); return; }
    if (!confirm(`Deletar TODOS os ${cards.length} cards do grupo "${currentGroupName}"?`)) return;
    groups[currentGroupName] = [];
    saveData();
    currentIndex = 0;
    renderCard();
    renderGroupSelector();
    showToast('Todos os cards deletados do grupo.');
}

function addCard(question, answer) {
    if (!currentGroupName) { showToast('Crie ou selecione um grupo primeiro!', true); return; }
    if (!question.trim() || !answer.trim()) { showToast('Preencha pergunta e resposta!', true); return; }
    const cards = getCurrentCards();
    cards.push({ question: question.trim(), answer: answer.trim() });
    saveData();
    currentIndex = cards.length - 1;
    renderCard();
    renderGroupSelector();
    document.getElementById('newQuestion').value = '';
    document.getElementById('newAnswer').value = '';
    showToast('Card adicionado! ✅');
}

function deleteCurrentCard() {
    if (!currentGroupName) { showToast('Nenhum grupo selecionado.', true); return; }
    const cards = getCurrentCards();
    if (!cards || cards.length === 0) { showToast('Nenhum card para deletar.', true); return; }
    if (cards.length === 1) {
        if (!confirm('Deletar o único card deste grupo?')) return;
        cards.pop(); saveData(); currentIndex = 0; renderCard(); renderGroupSelector();
        showToast('Último card deletado.');
        return;
    }
    const cardName = cards[currentIndex].question.substring(0,30) + (cards[currentIndex].question.length > 30 ? '...' : '');
    if (!confirm(`Deletar o card: "${cardName}"?`)) return;
    cards.splice(currentIndex, 1);
    saveData();
    if (currentIndex >= cards.length) currentIndex = cards.length - 1;
    renderCard();
    renderGroupSelector();
    showToast('Card deletado! 🗑️');
}

function resetDeck() {
    if (!currentGroupName) return;
    const cards = getCurrentCards();
    if (!cards || cards.length === 0) return;
    currentIndex = 0;
    renderCard();
    if (isFlipped) { flashcard.classList.remove('flipped'); isFlipped = false; }
    showToast('Deck reiniciado!');
}

function prevCard() {
    const cards = getCurrentCards();
    if (!cards || cards.length === 0) return;
    currentIndex = currentIndex > 0 ? currentIndex - 1 : cards.length - 1;
    renderCard();
}

function nextCard() {
    const cards = getCurrentCards();
    if (!cards || cards.length === 0) return;
    currentIndex = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
    renderCard();
}

function flipCard() {
    const cards = getCurrentCards();
    if (!cards || cards.length === 0) return;
    flashcard.classList.toggle('flipped');
    isFlipped = !isFlipped;
}

// ===== EVENTOS DOS BOTÕES =====
document.getElementById('addGroupBtn').addEventListener('click', () => {
    createGroup(document.getElementById('newGroupName').value);
});

document.getElementById('newGroupName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('addGroupBtn').click();
});

document.getElementById('addBtn').addEventListener('click', () => {
    addCard(
        document.getElementById('newQuestion').value,
        document.getElementById('newAnswer').value
    );
});

document.getElementById('newQuestion').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('newAnswer').focus();
});

document.getElementById('newAnswer').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('addBtn').click();
});

document.getElementById('flipBtn').addEventListener('click', flipCard);
document.getElementById('prevBtn').addEventListener('click', prevCard);
document.getElementById('nextBtn').addEventListener('click', nextCard);
document.getElementById('resetBtn').addEventListener('click', resetDeck);
document.getElementById('deleteBtn').addEventListener('click', deleteCurrentCard);
document.getElementById('deleteAllBtn').addEventListener('click', deleteAllCardsInGroup);
flashcard.addEventListener('click', flipCard);

// ============================================================
//  EVENTOS DE TECLADO CORRIGIDOS — ESPAÇO FUNCIONA NOS INPUTS
// ============================================================
document.addEventListener('keydown', (e) => {
    // Verifica se o foco está em um campo de input ou textarea
    const active = document.activeElement;
    const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');

    // Se estiver em um input, deixa o navegador tratar normalmente
    if (isInput) {
        return; // ← AQUI É A CORREÇÃO PRINCIPAL
    }

    // Fora dos inputs, os atalhos funcionam
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevCard();
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextCard();
    } else if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        flipCard();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteCurrentCard();
    }
});

// ===== INICIALIZAÇÃO =====
loadData();
const names = getGroupNames();
if (names.length > 0) currentGroupName = names[0];
else { currentGroupName = 'Geral'; groups['Geral'] = []; saveData(); }
renderGroupSelector();
renderCard();