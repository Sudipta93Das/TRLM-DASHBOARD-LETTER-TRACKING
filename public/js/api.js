// public/js/api.js - API Communication

const API_BASE = '/api';

// Get token from localStorage
function getToken() {
    return localStorage.getItem('auth_token');
}

// Set Authorization header
function getHeaders(needsAuth = false) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (needsAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    return headers;
}

// ==================== AUTHENTICATION ENDPOINTS ====================

async function apiLogin(username, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

async function apiVerifyToken() {
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: getHeaders(true)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            return null;
        }
        
        return data;
    } catch (error) {
        return null;
    }
}

// ==================== LETTERS ENDPOINTS ====================

async function apiGetLetters(filters = {}) {
    try {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE}/letters?${params}`, {
            headers: getHeaders()
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch letters');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

async function apiGetLetter(id) {
    try {
        const response = await fetch(`${API_BASE}/letters/${id}`, {
            headers: getHeaders()
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch letter');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

async function apiCreateLetter(letterData) {
    try {
        const formData = new FormData();
        
        // Add all fields to FormData
        for (const [key, value] of Object.entries(letterData)) {
            if (key === 'pdf_file') {
                formData.append('pdf', value);
            } else if (key === 'districts' && Array.isArray(value)) {
                value.forEach((district, index) => {
                    formData.append(`districts`, district);
                });
            } else if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        }
        
        const response = await fetch(`${API_BASE}/letters`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create letter');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

async function apiUpdateLetter(id, letterData) {
    try {
        const formData = new FormData();
        
        for (const [key, value] of Object.entries(letterData)) {
            if (key === 'pdf_file') {
                if (value) formData.append('pdf', value);
            } else if (key === 'districts' && Array.isArray(value)) {
                value.forEach((district) => {
                    formData.append(`districts`, district);
                });
            } else if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        }
        
        const response = await fetch(`${API_BASE}/letters/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update letter');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

async function apiDeleteLetter(id) {
    try {
        const response = await fetch(`${API_BASE}/letters/${id}`, {
            method: 'DELETE',
            headers: getHeaders(true)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete letter');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// ==================== ANALYTICS ENDPOINTS ====================

async function apiGetDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/analytics/dashboard`, {
            headers: getHeaders()
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch dashboard stats');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

async function apiGetDistrictAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/analytics/districts`, {
            headers: getHeaders()
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch district analytics');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

async function apiGetWarnings() {
    try {
        const response = await fetch(`${API_BASE}/analytics/warnings`, {
            headers: getHeaders()
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch warnings');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

async function apiGetActivityLog() {
    try {
        const response = await fetch(`${API_BASE}/admin/activity-log`, {
            headers: getHeaders(true)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch activity log');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// ==================== UTILITY FUNCTIONS ====================

function formatDate(dateString) {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function getDaysToDeadline(deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diff = deadlineDate - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getStatusClass(status) {
    const statusMap = {
        'Fast': 'status-fast',
        'On Time': 'status-on-time',
        'Late': 'status-late',
        'Waiting': 'status-waiting'
    };
    return statusMap[status] || '';
}

function getStatusEmoji(status) {
    const emojiMap = {
        'Fast': '🟢',
        'On Time': '🔵',
        'Late': '🔴',
        'Waiting': '🟡'
    };
    return emojiMap[status] || '';
}

function getWarningLevel(deadline, replyDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const daysToDeadline = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    if (replyDate) {
        const reply = new Date(replyDate);
        if (reply > deadlineDate) {
            return { level: 'LATE', icon: '⚫', color: '#6C757D', priority: 5 };
        }
        return null;
    }
    
    if (daysToDeadline < 0) {
        return { level: 'OVERDUE', icon: '🔴', color: '#DC3545', priority: 1 };
    } else if (daysToDeadline <= 1) {
        return { level: 'URGENT', icon: '🟠', color: '#FD7E14', priority: 2 };
    } else if (daysToDeadline <= 7) {
        return { level: 'DUE_SOON', icon: '🟡', color: '#FFC107', priority: 3 };
    } else {
        return { level: 'PENDING', icon: '🟢', color: '#28A745', priority: 4 };
    }
}
