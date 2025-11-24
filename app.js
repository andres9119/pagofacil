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
    profileForm.name.value = user.name;
    profileForm.email.value = user.email;
    profileForm.phone.value = user.phone;
    profileForm.method.value = user.preferredMethod;
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
    const { name, email, phone, method, password, confirmPassword } = form;
    if (password.value !== confirmPassword.value) {
        alert('Las contraseñas no coinciden.');
        return;
    }
    if (state.users.some((user) => user.email === email.value)) {
        alert('Ya existe un usuario con ese correo.');
        return;
    }

    const newUser = {
        id: Date.now(),
        name: name.value,
        email: email.value,
        phone: phone.value,
        preferredMethod: method.value,
        role: 'usuario',
        balance: 0,
        password: password.value
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
    const { email, password } = event.target;
    const user = state.users.find((u) => u.email === email.value.trim());
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
    const { phone, amount, method, description } = event.target;
    const value = Number(amount.value);
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
        contact: phone.value,
        method: method.value,
        amount: -value,
        status: 'Completado',
        description: description.value || 'Pago enviado'
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
    const { amount, method, card, holder } = event.target;
    const value = Number(amount.value);
    if (value <= 0) {
        alert('Ingresa un monto válido.');
        return;
    }
    user.balance += value;
    state.transactions.push({
        id: Date.now(),
        userId: user.id,
        contact: 'Recarga',
        method: method.value,
        amount: value,
        status: 'Completado',
        description: `Recarga con ${method.value}`
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
    const { name, email, phone, method } = event.target;
    user.name = name.value;
    user.email = email.value;
    user.phone = phone.value;
    user.preferredMethod = method.value;
    saveState();
    updateHeaderState();
    renderDashboard();
    alert('Datos actualizados.');
};

const handleSecurityUpdate = (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    if (!user) return;
    const { newPassword, confirmNewPassword } = event.target;
    if (newPassword.value !== confirmNewPassword.value) {
        alert('Las contraseñas no coinciden.');
        return;
    }
    user.password = newPassword.value;
    saveState();
    event.target.reset();
    alert('Contraseña actualizada.');
};

const handleQuickAmount = (event) => {
    const amount = event.target.dataset.amount;
    if (!amount) return;
    const form = document.getElementById('funds-form');
    form.amount.value = amount;
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
// Datos simulados almacenados en localStorage
const initStorage = () => {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([
            {
                email: 'admin@pagofacil.com',
                password: 'cualquiera',
                fullName: 'andres bateca',
                phone: '3178808080',
                paymentMethod: 'billetera',
                balance: 1000.00,
                transactions: [
                    {
                        id: 1,
                        type: 'sent',
                        name: 'María González',
                        method: 'Tarjeta de Crédito',
                        date: '9 nov 2025',
                        amount: 150.00,
                        status: 'Completado'
                    },
                    {
                        id: 2,
                        type: 'received',
                        name: 'Juan Pérez',
                        method: 'Transferencia Bancaria',
                        date: '7 nov 2025',
                        amount: 500.00,
                        status: 'Completado'
                    }
                ]
            }
        ]));
    }
    
    if (!localStorage.getItem('currentUser')) {
        localStorage.setItem('currentUser', '');
    }
};

// Inicializar almacenamiento al cargar
initStorage();

// Obtener usuario actual
const getCurrentUser = () => {
    const email = localStorage.getItem('currentUser');
    if (!email) return null;
    
    const users = JSON.parse(localStorage.getItem('users'));
    return users.find(u => u.email === email);
};

// Guardar usuario actual
const setCurrentUser = (email) => {
    localStorage.setItem('currentUser', email);
};

// Actualizar usuario
const updateUser = (user) => {
    const users = JSON.parse(localStorage.getItem('users'));
    const index = users.findIndex(u => u.email === user.email);
    if (index !== -1) {
        users[index] = user;
        localStorage.setItem('users', JSON.stringify(users));
    }
};

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            setCurrentUser(email);
            window.location.href = 'dashboard.html';
        } else {
            alert('Credenciales incorrectas. Usa: admin@pagofacil.com / cualquiera');
        }
    });
}

// Registro
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }
        
        const newUser = {
            email: document.getElementById('email').value,
            password: password,
            fullName: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            balance: 0.00,
            transactions: []
        };
        
        const users = JSON.parse(localStorage.getItem('users'));
        
        if (users.find(u => u.email === newUser.email)) {
            alert('Este correo ya está registrado');
            return;
        }
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        setCurrentUser(newUser.email);
        
        alert('Cuenta creada exitosamente');
        window.location.href = 'dashboard.html';
    });
}

// Dashboard - Cargar datos
const loadDashboard = () => {
    const user = getCurrentUser();
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Actualizar nombre de usuario
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = user.fullName;
    }
    
    // Actualizar balance
    const availableBalance = document.getElementById('availableBalance');
    if (availableBalance) {
        availableBalance.textContent = `$ ${user.balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Calcular totales
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthTransactions = user.transactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
    });
    
    const totalSent = monthTransactions
        .filter(t => t.type === 'sent')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalReceived = monthTransactions
        .filter(t => t.type === 'received')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSentEl = document.getElementById('totalSent');
    if (totalSentEl) {
        totalSentEl.textContent = `$ ${totalSent.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    const totalReceivedEl = document.getElementById('totalReceived');
    if (totalReceivedEl) {
        totalReceivedEl.textContent = `$ ${totalReceived.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Cargar transacciones
    loadTransactions();
};

// Cargar transacciones
const loadTransactions = () => {
    const user = getCurrentUser();
    if (!user) return;
    
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;
    
    transactionsList.innerHTML = '';
    
    if (user.transactions.length === 0) {
        transactionsList.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-gray);">No hay transacciones aún</div>';
        return;
    }
    
    // Ordenar por fecha (más recientes primero)
    const sortedTransactions = [...user.transactions].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedTransactions.forEach(transaction => {
        const transactionEl = document.createElement('div');
        transactionEl.className = 'transaction-item';
        
        const iconClass = transaction.type === 'sent' ? 'sent' : 'received';
        const iconSvg = transaction.type === 'sent' 
            ? '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'
            : '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>';
        
        const amountClass = transaction.type === 'sent' ? 'negative' : 'positive';
        const amountSign = transaction.type === 'sent' ? '-' : '+';
        
        transactionEl.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-icon ${iconClass}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${iconSvg}
                    </svg>
                </div>
                <div class="transaction-details">
                    <h4>${transaction.name}</h4>
                    <p>${transaction.method} • ${transaction.date}</p>
                </div>
            </div>
            <div class="transaction-amount">
                <div class="amount ${amountClass}">${amountSign}$ ${transaction.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <span class="transaction-status">${transaction.status}</span>
            </div>
        `;
        
        transactionsList.appendChild(transactionEl);
    });
};

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.setItem('currentUser', '');
            window.location.href = 'index.html';
        }
    });
}

// Realizar Pago
const paymentForm = document.getElementById('paymentForm');
if (paymentForm) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
    } else {
        const availableBalance = document.getElementById('availableBalance');
        if (availableBalance) {
            availableBalance.textContent = `$ ${user.balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }
    
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const user = getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        const amount = parseFloat(document.getElementById('amount').value);
        const phoneNumber = document.getElementById('phoneNumber').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const description = document.getElementById('description').value || 'Sin descripción';
        
        if (amount <= 0) {
            alert('El monto debe ser mayor a 0');
            return;
        }
        
        if (amount > user.balance) {
            alert('No tienes saldo suficiente');
            return;
        }
        
        if (confirm(`¿Confirmas el pago de $${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} a ${phoneNumber}?`)) {
            // Actualizar balance
            user.balance -= amount;
            
            // Agregar transacción
            const newTransaction = {
                id: Date.now(),
                type: 'sent',
                name: phoneNumber,
                method: document.getElementById('paymentMethod').options[document.getElementById('paymentMethod').selectedIndex].text,
                date: new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }),
                amount: amount,
                status: 'Completado',
                description: description
            };
            
            user.transactions.push(newTransaction);
            updateUser(user);
            
            alert('Pago realizado exitosamente');
            window.location.href = 'dashboard.html';
        }
    });
}

// Agregar Fondos
const addFundsPage = () => {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const currentBalance = document.getElementById('currentBalance');
    if (currentBalance) {
        currentBalance.textContent = `$ ${user.balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Botones de monto rápido
    const amountButtons = document.querySelectorAll('.amount-btn');
    amountButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            amountButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('amount').value = btn.dataset.amount;
        });
    });
    
    // Mostrar/ocultar detalles de tarjeta
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const cardDetails = document.getElementById('cardDetails');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', () => {
            const methodCards = document.querySelectorAll('.payment-method-card');
            methodCards.forEach(card => card.classList.remove('active'));
            document.querySelector(`[data-method="${method.value}"]`).classList.add('active');
            
            if (method.value === 'credito' || method.value === 'debito') {
                cardDetails.style.display = 'block';
            } else {
                cardDetails.style.display = 'none';
            }
        });
    });
    
    // Formatear número de tarjeta
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '');
            let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formatted;
        });
    }
    
    // Formatear fecha de vencimiento
    const cardExpiry = document.getElementById('cardExpiry');
    if (cardExpiry) {
        cardExpiry.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // Enviar formulario
    const addFundsBtn = document.getElementById('addFundsBtn');
    if (addFundsBtn) {
        addFundsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            const amount = parseFloat(document.getElementById('amount').value);
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
            
            if (!amount || amount <= 0) {
                alert('Por favor ingresa un monto válido');
                return;
            }
            
            if ((paymentMethod === 'credito' || paymentMethod === 'debito')) {
                const cardNumber = document.getElementById('cardNumber').value;
                const cardName = document.getElementById('cardName').value;
                const cardExpiry = document.getElementById('cardExpiry').value;
                const cardCVV = document.getElementById('cardCVV').value;
                
                if (!cardNumber || !cardName || !cardExpiry || !cardCVV) {
                    alert('Por favor completa todos los datos de la tarjeta');
                    return;
                }
            }
            
            if (confirm(`¿Confirmas agregar $${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} a tu cuenta?`)) {
                user.balance += amount;
                
                const newTransaction = {
                    id: Date.now(),
                    type: 'received',
                    name: 'Depósito',
                    method: paymentMethod === 'credito' ? 'Tarjeta de Crédito' : 
                           paymentMethod === 'debito' ? 'Tarjeta de Débito' :
                           paymentMethod === 'transferencia' ? 'Transferencia Bancaria' : 'Billetera Digital',
                    date: new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }),
                    amount: amount,
                    status: 'Completado'
                };
                
                user.transactions.push(newTransaction);
                updateUser(user);
                
                alert('Fondos agregados exitosamente');
                window.location.href = 'dashboard.html';
            }
        });
    }
};

// Configuración
const settingsPage = () => {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Formulario de información personal
    const personalInfoForm = document.getElementById('personalInfoForm');
    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            user.fullName = document.getElementById('fullName').value;
            user.email = document.getElementById('email').value;
            user.phone = document.getElementById('phone').value;
            user.paymentMethod = document.getElementById('paymentMethod').value;
            
            updateUser(user);
            alert('Información actualizada exitosamente');
        });
    }
    
    // Formulario de seguridad
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (currentPassword !== user.password) {
                alert('La contraseña actual es incorrecta');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                alert('Las nuevas contraseñas no coinciden');
                return;
            }
            
            if (newPassword.length < 6) {
                alert('La nueva contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            user.password = newPassword;
            updateUser(user);
            
            alert('Contraseña actualizada exitosamente');
            securityForm.reset();
        });
    }
};

// Soporte - FAQ
const supportPage = () => {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(i => i.classList.remove('active'));
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
    
    // Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabId}-content`).classList.add('active');
        });
    });
    
    // Chat
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatMessages = document.getElementById('chatMessages');
    
    const sendMessage = () => {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Agregar mensaje del usuario
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user';
        userMessage.innerHTML = `<p>${message}</p>`;
        chatMessages.appendChild(userMessage);
        
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simular respuesta del bot
        setTimeout(() => {
            const botMessage = document.createElement('div');
            botMessage.className = 'chat-message bot';
            botMessage.innerHTML = '<p>Gracias por tu mensaje. Nuestro equipo de soporte te responderá pronto. Mientras tanto, puedes revisar nuestras preguntas frecuentes.</p>';
            chatMessages.appendChild(botMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    };
    
    if (sendChatBtn) {
        sendChatBtn.addEventListener('click', sendMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
};

// Inicializar páginas según la URL
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'dashboard.html' || currentPage === '') {
        loadDashboard();
    } else if (currentPage === 'add-funds.html') {
        addFundsPage();
    } else if (currentPage === 'settings.html') {
        settingsPage();
    } else if (currentPage === 'support.html') {
        supportPage();
    }
});


