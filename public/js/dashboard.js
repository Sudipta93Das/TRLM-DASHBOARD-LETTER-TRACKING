// public/js/dashboard.js - Dashboard Functionality

async function loadDashboardData() {
    try {
        // Load statistics
        const stats = await apiGetDashboardStats();
        const { statistics, warnings } = stats;
        
        // Update stat cards
        document.getElementById('total-letters').textContent = statistics.total_letters;
        document.getElementById('replied-letters').textContent = statistics.total_letters - statistics.pending_letters;
        
        const repliedPercent = ((statistics.total_letters - statistics.pending_letters) / statistics.total_letters * 100).toFixed(1);
        document.getElementById('replied-percent').textContent = `(${repliedPercent}%)`;
        
        document.getElementById('pending-letters').textContent = statistics.pending_letters;
        const pendingPercent = ((statistics.pending_letters / statistics.total_letters) * 100).toFixed(1);
        document.getElementById('pending-percent').textContent = `(${pendingPercent}%)`;
        
        // Update warning counts
        document.getElementById('overdue-count').textContent = warnings.overdue || 0;
        document.getElementById('due-soon-count').textContent = warnings.due_soon || 0;
        document.getElementById('pending-count').textContent = warnings.pending || 0;
        
        // Show alert banner if there are warnings
        if (warnings.overdue > 0) {
            const totalWarnings = warnings.overdue + warnings.due_soon;
            document.getElementById('alert-text').textContent = `⚠️ ACTIVE ALERTS: ${warnings.overdue} Overdue | ${warnings.due_soon} Due Soon | ${warnings.pending} Pending`;
            document.getElementById('alert-banner').style.display = 'flex';
        }
        
        // Load district analytics
        await loadDistrictAnalytics();
        
        // Load recent letters
        await loadRecentLetters();
        
        // Update last updated time
        document.getElementById('last-updated').textContent = new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

async function loadDistrictAnalytics() {
    try {
        const districtData = await apiGetDistrictAnalytics();
        
        const districtSummary = document.getElementById('district-summary');
        districtSummary.innerHTML = '';
        
        if (districtData && districtData.length > 0) {
            districtData.forEach(district => {
                if (!district.district_name) return;
                
                const districtItem = document.createElement('div');
                districtItem.className = 'district-item';
                
                const totalLetters = district.total_letters || 0;
                const efficiency = ((district.efficiency || 0) / 100);
                
                let efficiencyColor = '#28A745'; // Green
                if (efficiency < 0.5) {
                    efficiencyColor = '#DC3545'; // Red
                } else if (efficiency < 0.7) {
                    efficiencyColor = '#FFC107'; // Yellow
                }
                
                districtItem.innerHTML = `
                    <h4>${district.district_name}</h4>
                    <div class="district-metrics">
                        <div class="metric">
                            <span class="metric-label">Total:</span>
                            <span class="metric-value">${totalLetters}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">On Time:</span>
                            <span class="metric-value">${district.on_time || 0}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Fast:</span>
                            <span class="metric-value">${district.fast || 0}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Late:</span>
                            <span class="metric-value">${district.late || 0}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Waiting:</span>
                            <span class="metric-value">${district.waiting || 0}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Efficiency:</span>
                            <span class="metric-value" style="color: ${efficiencyColor};">${(district.efficiency || 0).toFixed(1)}%</span>
                        </div>
                    </div>
                `;
                districtSummary.appendChild(districtItem);
            });
        }
    } catch (error) {
        console.error('Error loading district analytics:', error);
    }
}

async function loadRecentLetters() {
    try {
        const response = await apiGetLetters({ limit: 10, page: 1 });
        const letters = response.data || [];
        
        const lettersList = document.getElementById('recent-letters-list');
        lettersList.innerHTML = '';
        
        if (letters.length === 0) {
            lettersList.innerHTML = '<p class="loading">No letters found</p>';
            return;
        }
        
        letters.forEach(letter => {
            const card = createLetterCard(letter);
            lettersList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading recent letters:', error);
        document.getElementById('recent-letters-list').innerHTML = '<p class="loading">Error loading letters</p>';
    }
}

function createLetterCard(letter) {
    const card = document.createElement('div');
    card.className = 'letter-card';
    
    const statusClass = getStatusClass(letter.status);
    const statusEmoji = getStatusEmoji(letter.status);
    
    card.innerHTML = `
        <div class="letter-card-header">
            <div class="letter-number">${letter.letter_number}</div>
            <div class="letter-status ${statusClass}">${statusEmoji} ${letter.status}</div>
        </div>
        <div class="letter-subject">${letter.subject}</div>
        <div class="letter-meta">
            <div class="letter-meta-item">
                <span>📅 Despatch:</span>
                <span>${formatDate(letter.date_of_despatch)}</span>
            </div>
            <div class="letter-meta-item">
                <span>⏰ Deadline:</span>
                <span>${formatDate(letter.deadline)}</span>
            </div>
            <div class="letter-meta-item">
                <span>📍 Districts:</span>
                <span>${letter.districts ? letter.districts.split(',').join(', ') : 'N/A'}</span>
            </div>
            ${letter.date_of_reply ? `
            <div class="letter-meta-item">
                <span>✅ Reply:</span>
                <span>${formatDate(letter.date_of_reply)}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    return card;
}

function showNotification(message, type = 'info') {
    // Create a simple notification div
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    
    const colors = {
        'success': '#28A745',
        'error': '#DC3545',
        'warning': '#FFC107',
        'info': '#007BFF'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
