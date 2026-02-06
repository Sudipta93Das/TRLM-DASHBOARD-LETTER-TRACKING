// public/js/warnings.js - Warnings Page

let warningsData = [];

async function loadWarnings() {
    try {
        const data = await apiGetWarnings();
        warningsData = data || [];
        
        renderSummaryCards();
        renderWarnings();
    } catch (error) {
        console.error('Error loading warnings:', error);
        showNotification('Error loading warnings', 'error');
    }
}

function renderSummaryCards() {
    const summaryContainer = document.getElementById('summary-cards');
    summaryContainer.innerHTML = '';
    
    let overdue = 0;
    let urgent = 0;
    let dueSoon = 0;
    let pending = 0;
    let late = 0;
    
    warningsData.forEach(warning => {
        if (!warning.warning_level) return;
        
        switch (warning.warning_level) {
            case 'OVERDUE':
                overdue++;
                break;
            case 'URGENT':
                urgent++;
                break;
            case 'DUE_SOON':
                dueSoon++;
                break;
            case 'PENDING':
                pending++;
                break;
            case 'LATE':
                late++;
                break;
        }
    });
    
    const cards = [
        { label: 'Critical (Overdue)', count: overdue, class: 'critical', icon: '🔴' },
        { label: 'Urgent (1-3 days)', count: urgent, class: 'urgent', icon: '🟠' },
        { label: 'Due Soon (4-7 days)', count: dueSoon, class: 'due-soon', icon: '🟡' },
        { label: 'Pending (>7 days)', count: pending, class: 'pending', icon: '🟢' },
        { label: 'Late (History)', count: late, class: 'late', icon: '⚫' }
    ];
    
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = `summary-card ${card.class}`;
        cardEl.innerHTML = `
            <div class="summary-number">${card.icon} ${card.count}</div>
            <div class="summary-label">${card.label}</div>
        `;
        summaryContainer.appendChild(cardEl);
    });
}

function renderWarnings() {
    const warningsList = document.getElementById('warnings-list');
    warningsList.innerHTML = '';
    
    if (warningsData.length === 0) {
        warningsList.innerHTML = '<p style="text-align: center; color: var(--dark-gray);">No warnings</p>';
        return;
    }
    
    // Sort by priority
    const sorted = [...warningsData].sort((a, b) => {
        const priorityMap = {
            'OVERDUE': 1,
            'URGENT': 2,
            'DUE_SOON': 3,
            'PENDING': 4,
            'LATE': 5
        };
        return (priorityMap[a.warning_level] || 99) - (priorityMap[b.warning_level] || 99);
    });
    
    sorted.forEach(warning => {
        if (!warning.letter_number) return;
        
        const warningEl = document.createElement('div');
        warningEl.className = 'warning-row';
        
        const warningInfo = getWarningLevel(warning.deadline, warning.date_of_reply);
        if (!warningInfo) return;
        
        const daysText = warning.days_to_deadline !== null ? `${Math.abs(warning.days_to_deadline)} days` : 'N/A';
        const timeText = warning.days_to_deadline < 0 
            ? `${Math.abs(warning.days_to_deadline)} days overdue`
            : warning.days_to_deadline === 0
            ? 'Today'
            : `${warning.days_to_deadline} days remaining`;
        
        let borderColor = warningInfo.color;
        
        warningEl.style.borderLeftColor = borderColor;
        
        warningEl.innerHTML = `
            <div class="warning-icon">${warningInfo.icon}</div>
            <div class="warning-details">
                <div class="warning-title">${warning.letter_number}</div>
                <div style="color: var(--dark-gray); font-size: 0.9rem;">${warning.subject.substring(0, 80)}</div>
                <div class="warning-meta">
                    <div class="warning-meta-item">
                        <strong>Deadline:</strong> ${formatDate(warning.deadline)}
                    </div>
                    <div class="warning-meta-item">
                        <strong>Districts:</strong> ${warning.districts || 'N/A'}
                    </div>
                    <div class="warning-meta-item">
                        <strong>Status:</strong> <span style="font-weight: bold; color: ${borderColor};">${timeText}</span>
                    </div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: bold; color: ${borderColor}; font-size: 1.1rem;">${warningInfo.level.replace(/_/g, ' ')}</div>
                <a href="/pages/data-table.html" style="color: var(--primary-saffron); text-decoration: none; font-size: 0.85rem; font-weight: bold;">View Details →</a>
            </div>
        `;
        
        warningsList.appendChild(warningEl);
    });
}

function showNotification(message, type = 'info') {
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

document.addEventListener('DOMContentLoaded', loadWarnings);
