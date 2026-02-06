// public/js/auth.js - Authentication Management

let currentUser = null;

async function initAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        updateLoginUI(false);
        return;
    }
    
    const verification = await apiVerifyToken();
    if (verification && verification.valid) {
        currentUser = verification.user;
        updateLoginUI(true);
    } else {
        localStorage.removeItem('auth_token');
        updateLoginUI(false);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginError = document.getElementById('loginError');
    
    if (!username || !password) {
        loginError.textContent = 'Please enter both username and password';
        return;
    }
    
    try {
        loginError.textContent = '';
        const result = await apiLogin(username, password);
        
        if (result.success) {
            localStorage.setItem('auth_token', result.token);
            currentUser = { username: result.username };
            closeLoginModal();
            updateLoginUI(true);
            showNotification('Login successful!', 'success');
        } else {
            loginError.textContent = result.error || 'Login failed';
        }
    } catch (error) {
        loginError.textContent = error.message || 'Login failed. Please try again.';
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('auth_token');
        currentUser = null;
        updateLoginUI(false);
        window.location.href = '/';
    }
}

function isLoggedIn() {
    return currentUser !== null && localStorage.getItem('auth_token') !== null;
}

function updateLoginUI(loggedIn) {
    const loginBtn = document.getElementById('login-btn');
    const adminMenu = document.getElementById('admin-menu');
    
    if (loggedIn && currentUser) {
        loginBtn.style.display = 'none';
        adminMenu.style.display = 'flex';
    } else {
        loginBtn.style.display = 'block';
        adminMenu.style.display = 'none';
    }
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('username').focus();
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').textContent = '';
}

function requireAuth() {
    if (!isLoggedIn()) {
        showNotification('Please login to access this page', 'warning');
        window.location.href = '/';
        return false;
    }
    return true;
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('loginModal');
    if (modal && event.target === modal) {
        closeLoginModal();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAuth);
