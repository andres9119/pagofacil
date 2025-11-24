const STORAGE_KEY = 'pagofacil_digital_state';

const DEFAULT_STATE = {
    users: [
        {
            id: 1,
            name: 'Admin User',
            email: 'admin@pagofacil.com',
            phone: '+54 9 11 1234-5678',
            preferredMethod: 'Tarjeta de Crédito',
            role: 'admin',
            balance: 5000,
            password: 'demo'
        },
        {
            id: 2,
            name: 'María González',
            email: 'maria@email.com',
            phone: '+54 9 11 2345-6789',
            preferredMethod: 'Tarjeta de Débito',
            role: 'usuario',
            balance: 2500,
            password: 'demo'
        },
        {
            id: 3,
            name: 'Juan Pérez',
            email: 'juan@email.com',
            phone: '+54 9 11 3456-7890',
            preferredMethod: 'Transferencia Bancaria',
            role: 'usuario',
            balance: 3200,
            password: 'demo'
        }
    ],
    transactions: [
        {
            id: 1,
            userId: 1,
            contact: 'María González',
            method: 'Tarjeta de Crédito',
            amount: -150,
            status: 'Completado',
            description: 'Tarjeta de crédito · 9 nov 2025'
        },
        {
            id: 2,
            userId: 1,
            contact: 'Juan Pérez',
            method: 'Transferencia Bancaria',
            amount: 500,
            status: 'Completado',
            description: 'Transferencia · 7 nov 2025'
        },
        {
            id: 3,
            userId: 2,
            contact: 'Pago servicios',
            method: 'Billetera Digital',
            amount: -210,
            status: 'Completado',
            description: 'Servicios · 5 nov 2025'
        }
    ],
    currentUserId: null
};

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const loadState = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    const initial = clone(DEFAULT_STATE);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
};

let state = loadState();

const saveState = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const formatCurrency = (value) =>
    new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    }).format(value);

const getCurrentUser = () => state.users.find((u) => u.id === state.currentUserId) || null;

const views = document.querySelectorAll('.view');
const nav = document.querySelector('.nav');
const menuToggle = document.querySelector('.menu-toggle');
const navItems = document.querySelectorAll('[data-view]');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const userPill = document.getElementById('user-pill');
const userPillName = document.getElementById('user-pill-name');
const logoutBtn = document.getElementById('logout-btn');

const showView = (viewId) => {
    views.forEach((view) => view.classList.toggle('view--active', view.id === `view-${viewId}`));
    document.querySelectorAll('.nav-item').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.view === viewId);
    });
    if (viewId === 'dashboard') renderDashboard();
    if (viewId === 'pay') updatePayView();
    if (viewId === 'add-funds') updateFundsView();
    if (viewId === 'settings') fillProfileForm();
    if (viewId === 'admin') renderAdminView();
};

const updateHeaderState = () => {
    const user = getCurrentUser();
    const isLogged = Boolean(user);
    loginBtn.style.display = isLogged ? 'none' : 'inline-flex';
    registerBtn.style.display = isLogged ? 'none' : 'inline-flex';
    userPill.style.display = isLogged ? 'flex' : 'none';
    document.querySelectorAll('.nav-item--private').forEach((el) => {
        el.style.display = isLogged ? 'inline-flex' : 'none';
    });
    document.querySelectorAll('.nav-item--admin').forEach((el) => {
        el.style.display = user?.role === 'admin' ? 'inline-flex' : 'none';
    });
    if (isLogged) {
        userPillName.textContent = `Hola, ${user.name}`;
    }
};

const renderLandingTransactions = () => {
    const container = document.getElementById('landing-transactions');
    if (!container) return;
    const sample = state.transactions.slice(0, 3);
    container.innerHTML = sample
        .map(
            (t) =>
                `<li class="landing-transaction">
                    <span>${t.contact}</span>
                    <span>${t.amount > 0 ? '+' : ''}${formatCurrency(t.amount)}</span>
                </li>`
        )
        .join('');
};

const renderTransactionsList = (transactions, targetId) => {
    const container = document.getElementById(targetId);
    if (!container) return;
    if (!transactions.length) {
        container.innerHTML = '<li class="transaction-item"><span>No hay transacciones registradas.</span></li>';
        return;
    }
    container.innerHTML = transactions
        .map(
            (t) => `
            <li class="transaction-item">
                <div class="transaction-item__info">
                    <strong>${t.contact}</strong>
                    <span>${t.description}</span>
                </div>
                <div class="transaction-item__amount ${
                    t.amount < 0 ? 'transaction-item__amount--negative' : 'transaction-item__amount--positive'
                }">
                    ${t.amount > 0 ? '+' : ''}${formatCurrency(t.amount)}
                </div>
            </li>
        `
        )
        .join('');
};

const renderDashboard = () => {
    const user = getCurrentUser();
    if (!user) return showView('landing');

    document.getElementById('dashboard-username').textContent = user.name;
    document.getElementById('balance-available').textContent = formatCurrency(user.balance);

    const userTransactions = state.transactions.filter((t) => t.userId === user.id);
    const sent = userTransactions.filter((t) => t.amount < 0).reduce((acc, t) => acc + t.amount, 0);
    const received = userTransactions.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);

    document.getElementById('balance-sent').textContent = formatCurrency(Math.abs(sent));
    document.getElementById('balance-received').textContent = formatCurrency(received);

    renderTransactionsList(userTransactions, 'dashboard-transactions');
};

const updatePayView = () => {
    const user = getCurrentUser();
    if (!user) return showView('login');
    document.getElementById('pay-current-balance').textContent = formatCurrency(user.balance);
};

const updateFundsView = () => {
    const user = getCurrentUser();
    if (!user) return showView('login');
    document.getElementById('funds-current-balance').textContent = formatCurrency(user.balance);
};

const fillProfileForm = () => {
    const user = getCurrentUser();
    if (!user) return showView('login');
    const profileForm = document.getElementById('profile-form');
    if (!profileForm) return;
    profileForm.elements.namedItem('name').value = user.name;
    profileForm.elements.namedItem('email').value = user.email;
    profileForm.elements.namedItem('phone').value = user.phone;
    profileForm.elements.namedItem('method').value = user.preferredMethod;
};

const renderAdminView = () => {
    const user = getCurrentUser();
    const warning = document.getElementById('admin-warning');
    const tableUsers = document.getElementById('admin-users-table');
    const tableTx = document.getElementById('admin-transactions-table');

    if (!user || user.role !== 'admin') {
        warning.classList.remove('hidden');
        tableUsers.innerHTML = '';
        tableTx.innerHTML = '';
        document.getElementById('admin-total-users').textContent = '0';
        document.getElementById('admin-total-transactions').textContent = '0';
        document.getElementById('admin-total-volume').textContent = '$0';
        return;
    }

    warning.classList.add('hidden');
    document.getElementById('admin-total-users').textContent = state.users.length;
    document.getElementById('admin-total-transactions').textContent = state.transactions.length;
    const volume = state.transactions.reduce((acc, t) => acc + t.amount, 0);
    document.getElementById('admin-total-volume').textContent = formatCurrency(volume);

    tableUsers.innerHTML = state.users
        .map(
            (u) => `
            <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.phone}</td>
                <td>${u.preferredMethod}</td>
                <td>${formatCurrency(u.balance)}</td>
                <td>${u.role}</td>
            </tr>`
        )
        .join('');

    const latest = state.transactions.slice(-5).reverse();
    tableTx.innerHTML = latest
        .map(
            (t) => `
            <tr>
                <td>${state.users.find((u) => u.id === t.userId)?.name ?? 'N/D'}</td>
                <td>${t.contact}</td>
                <td>${t.method}</td>
                <td>${formatCurrency(t.amount)}</td>
                <td>${t.status}</td>
            </tr>`
        )
        .join('');
};

const handleRegister = (event) => {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    const email = data.get('email');
    const password = data.get('password');
    if (password !== data.get('confirmPassword')) {
        alert('Las contraseñas no coinciden.');
        return;
    }
    if (state.users.some((user) => user.email === email)) {
        alert('Ya existe un usuario con ese correo.');
        return;
    }

    const newUser = {
        id: Date.now(),
        name: data.get('name'),
        email,
        phone: data.get('phone'),
        preferredMethod: data.get('method'),
        role: 'usuario',
        balance: 0,
        password: password || 'demo'
    };

    state.users.push(newUser);
    state.currentUserId = newUser.id;
    saveState();
    updateHeaderState();
    renderDashboard();
    showView('dashboard');
    form.reset();
};

const handleLogin = (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const email = data.get('email')?.trim();
    const user = state.users.find((u) => u.email === email);
    if (!user) {
        alert('Usuario no encontrado.');
        return;
    }
    state.currentUserId = user.id;
    saveState();
    updateHeaderState();
    renderDashboard();
    showView('dashboard');
};

const handleLogout = () => {
    state.currentUserId = null;
    saveState();
    updateHeaderState();
    showView('landing');
};

const handlePayment = (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) return showView('login');
    const data = new FormData(event.target);
    const value = Number(data.get('amount'));
    if (value <= 0) {
        alert('Ingresa un monto válido.');
        return;
    }
    if (value > user.balance) {
        alert('No tienes saldo suficiente.');
        return;
    }

    user.balance -= value;
    state.transactions.push({
        id: Date.now(),
        userId: user.id,
        contact: data.get('phone'),
        method: data.get('method'),
        amount: -value,
        status: 'Completado',
        description: data.get('description') || 'Pago enviado'
    });
    saveState();
    event.target.reset();
    renderDashboard();
    alert('Pago realizado con éxito.');
};

const handleAddFunds = (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) return showView('login');
    const data = new FormData(event.target);
    const value = Number(data.get('amount'));
    if (value <= 0) {
        alert('Ingresa un monto válido.');
        return;
    }
    user.balance += value;
    state.transactions.push({
        id: Date.now(),
        userId: user.id,
        contact: 'Recarga',
        method: data.get('method'),
        amount: value,
        status: 'Completado',
        description: `Recarga con ${data.get('method')}`
    });
    saveState();
    event.target.reset();
    renderDashboard();
    alert(`Se agregaron ${formatCurrency(value)} a tu cuenta.`);
};

const handleProfileUpdate = (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) return;
    const data = new FormData(event.target);
    user.name = data.get('name');
    user.email = data.get('email');
    user.phone = data.get('phone');
    user.preferredMethod = data.get('method');
    saveState();
    updateHeaderState();
    renderDashboard();
    alert('Datos actualizados.');
};

const handleSecurityUpdate = (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) return;
    const data = new FormData(event.target);
    const newPassword = data.get('newPassword');
    if (newPassword !== data.get('confirmNewPassword')) {
        alert('Las contraseñas no coinciden.');
        return;
    }
    user.password = newPassword || 'demo';
    saveState();
    event.target.reset();
    alert('Contraseña actualizada.');
};

const handleQuickAmount = (event) => {
    const amount = event.target.dataset.amount;
    if (!amount) return;
    const form = document.getElementById('funds-form');
    if (!form) return;
    form.elements.namedItem('amount').value = amount;
};

const handleClearTransactions = () => {
    const user = getCurrentUser();
    if (!user) return;
    if (!confirm('¿Eliminar todas las transacciones de tu historial?')) return;
    state.transactions = state.transactions.filter((t) => t.userId !== user.id);
    saveState();
    renderDashboard();
};

const initEvents = () => {
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('pay-form')?.addEventListener('submit', handlePayment);
    document.getElementById('funds-form')?.addEventListener('submit', handleAddFunds);
    document.getElementById('profile-form')?.addEventListener('submit', handleProfileUpdate);
    document.getElementById('security-form')?.addEventListener('submit', handleSecurityUpdate);
    document.getElementById('clear-transactions-btn')?.addEventListener('click', handleClearTransactions);
    document.querySelectorAll('.pill').forEach((pill) => pill.addEventListener('click', handleQuickAmount));
    logoutBtn?.addEventListener('click', handleLogout);
    menuToggle?.addEventListener('click', () => nav.classList.toggle('nav--open'));
};

const initNavigation = () => {
    navItems.forEach((item) => {
        item.addEventListener('click', () => {
            const target = item.dataset.view;
            if (nav.classList.contains('nav--open')) nav.classList.remove('nav--open');
            showView(target);
        });
    });
};

const init = () => {
    initNavigation();
    initEvents();
    renderLandingTransactions();
    updateHeaderState();
    renderDashboard();
    document.getElementById('current-year').textContent = new Date().getFullYear();
};

document.addEventListener('DOMContentLoaded', init);
