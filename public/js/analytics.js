// public/js/analytics.js - Analytics Page

let districtData = [];

async function loadAnalytics() {
    try {
        const data = await apiGetDistrictAnalytics();
        districtData = data;
        
        renderDistrictTable(data);
        renderSummary(data);
    } catch (error) {
        console.error('Error loading analytics:', error);
        showNotification('Error loading analytics', 'error');
    }
}

function renderDistrictTable(districts) {
    const tbody = document.getElementById('district-tbody');
    tbody.innerHTML = '';
    
    if (!districts || districts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">No data available</td></tr>';
        return;
    }
    
    districts.forEach((district, index) => {
        if (!district.district_name) return;
        
        const row = document.createElement('tr');
        const totalLetters = district.total_letters || 0;
        const efficiency = (district.efficiency || 0).toFixed(2);
        
        const onTimePercent = totalLetters > 0 ? (((district.on_time || 0) / totalLetters) * 100).toFixed(1) : '0.0';
        const fastPercent = totalLetters > 0 ? (((district.fast || 0) / totalLetters) * 100).toFixed(1) : '0.0';
        const responseRate = totalLetters > 0 ? (((totalLetters - (district.waiting || 0)) / totalLetters) * 100).toFixed(1) : '0.0';
        
        let efficiencyColor = '#28A745';
        if (efficiency < 50) efficiencyColor = '#DC3545';
        else if (efficiency < 70) efficiencyColor = '#FFC107';
        
        row.innerHTML = `
            <td><strong>${district.district_name}</strong></td>
            <td>${totalLetters}</td>
            <td>${district.on_time || 0}</td>
            <td>${district.fast || 0}</td>
            <td>${district.late || 0}</td>
            <td>${district.waiting || 0}</td>
            <td>${onTimePercent}%</td>
            <td>${fastPercent}%</td>
            <td>${responseRate}%</td>
            <td style="color: ${efficiencyColor}; font-weight: bold;">${efficiency}%</td>
            <td>${index + 1}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderSummary(districts) {
    let totalLetters = 0;
    let totalOnTime = 0;
    let totalFast = 0;
    let totalLate = 0;
    let totalWaiting = 0;
    
    districts.forEach(d => {
        totalLetters += d.total_letters || 0;
        totalOnTime += d.on_time || 0;
        totalFast += d.fast || 0;
        totalLate += d.late || 0;
        totalWaiting += d.waiting || 0;
    });
    
    // Total Summary
    const totalSummary = document.getElementById('total-summary');
    totalSummary.innerHTML = `
        <div class="metric-row">
            <span class="metric-label">📧 Total Letters:</span>
            <span class="metric-value">${totalLetters}</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">✅ Responded:</span>
            <span class="metric-value">${totalLetters - totalWaiting}</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">⏳ Pending:</span>
            <span class="metric-value">${totalWaiting}</span>
        </div>
    `;
    
    // Status Summary
    const statusSummary = document.getElementById('status-summary');
    const onTimePercent = totalLetters > 0 ? ((totalOnTime / totalLetters) * 100).toFixed(1) : '0';
    const fastPercent = totalLetters > 0 ? ((totalFast / totalLetters) * 100).toFixed(1) : '0';
    const latePercent = totalLetters > 0 ? ((totalLate / totalLetters) * 100).toFixed(1) : '0';
    const waitingPercent = totalLetters > 0 ? ((totalWaiting / totalLetters) * 100).toFixed(1) : '0';
    
    statusSummary.innerHTML = `
        <div class="metric-row">
            <span class="metric-label">🟢 Fast (≤3 days):</span>
            <span class="metric-value">${totalFast} (${fastPercent}%)</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">🔵 On Time:</span>
            <span class="metric-value">${totalOnTime} (${onTimePercent}%)</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">🔴 Late:</span>
            <span class="metric-value">${totalLate} (${latePercent}%)</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">🟡 Waiting:</span>
            <span class="metric-value">${totalWaiting} (${waitingPercent}%)</span>
        </div>
    `;
    
    // Performance Summary
    const performanceSummary = document.getElementById('performance-summary');
    const responseRate = totalLetters > 0 ? (((totalLetters - totalWaiting) / totalLetters) * 100).toFixed(1) : '0';
    const efficiencyScore = totalLetters > 0 ? (((totalFast + totalOnTime) / totalLetters) * 100).toFixed(1) : '0';
    
    performanceSummary.innerHTML = `
        <div class="metric-row">
            <span class="metric-label">📊 Response Rate:</span>
            <span class="metric-value">${responseRate}%</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">⭐ Efficiency:</span>
            <span class="metric-value">${efficiencyScore}%</span>
        </div>
        <div class="metric-row">
            <span class="metric-label">🎯 Best District:</span>
            <span class="metric-value">${districts[0]?.district_name || 'N/A'}</span>
        </div>
    `;
}

function exportDistrictAnalytics() {
    if (districtData.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    let csv = 'District,Total Letters,On Time,Fast,Late,Waiting,On-Time %,Fast %,Response Rate %,Efficiency Score\n';
    
    districtData.forEach(d => {
        if (!d.district_name) return;
        
        const totalLetters = d.total_letters || 0;
        const onTimePercent = totalLetters > 0 ? (((d.on_time || 0) / totalLetters) * 100).toFixed(1) : '0.0';
        const fastPercent = totalLetters > 0 ? (((d.fast || 0) / totalLetters) * 100).toFixed(1) : '0.0';
        const responseRate = totalLetters > 0 ? (((totalLetters - (d.waiting || 0)) / totalLetters) * 100).toFixed(1) : '0.0';
        const efficiency = (d.efficiency || 0).toFixed(2);
        
        csv += [
            d.district_name,
            totalLetters,
            d.on_time || 0,
            d.fast || 0,
            d.late || 0,
            d.waiting || 0,
            onTimePercent,
            fastPercent,
            responseRate,
            efficiency
        ].join(',') + '\n';
    });
    
    downloadCSV(csv, 'TRLM_District_Analytics.csv');
    showNotification('Data exported to Excel format', 'success');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

document.addEventListener('DOMContentLoaded', loadAnalytics);
