// public/js/auth.js - Authentication Management

let currentUser = null;

// Notification function
function showNotification(message, type = 'info') {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification notification-${type}`;
    notificationDiv.textContent = message;
    notificationDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        z-index: 2000;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    
    const colors = {
        success: '#d4edda',
        error: '#f8d7da',
        warning: '#fff3cd',
        info: '#d1ecf1'
    };
    
    const textColors = {
        success: '#155724',
        error: '#721c24',
        warning: '#856404',
        info: '#0c5460'
    };
    
    notificationDiv.style.backgroundColor = colors[type] || colors.info;
    notificationDiv.style.color = textColors[type] || textColors.info;
    
    document.body.appendChild(notificationDiv);
    
    setTimeout(() => {
        notificationDiv.remove();
    }, 3000);
}

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
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        const usernameField = document.getElementById('username');
        if (usernameField) usernameField.focus();
    }
}

function closeLoginModal(event) {
    // If event is passed and it's clicking outside the modal content, close it
    if (event && event.target.id !== 'loginModal') return;
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
    }
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.reset();
    const loginError = document.getElementById('loginError');
    if (loginError) loginError.textContent = '';
    if (loginError) loginError.style.display = 'none';
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
