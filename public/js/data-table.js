// public/js/data-table.js - Data Table Functionality

let currentPage = 1;
let currentLimit = 25;
let allLetters = [];

async function loadLetters() {
    try {
        const search = document.getElementById('search').value.trim();
        const district = document.getElementById('district-filter').value;
        const status = document.getElementById('status-filter').value;
        const limit = document.getElementById('records-per-page').value || 25;
        
        currentLimit = parseInt(limit);
        
        const filters = {
            page: currentPage,
            limit: currentLimit
        };
        
        if (search) filters.search = search;
        if (district) filters.district = district;
        if (status) filters.status = status;
        
        const response = await apiGetLetters(filters);
        allLetters = response.data || [];
        
        renderTable(allLetters);
        renderPagination(response.total, response.page, response.limit);
    } catch (error) {
        console.error('Error loading letters:', error);
        showNotification('Error loading data', 'error');
    }
}

function renderTable(letters) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    if (letters.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">No letters found</td></tr>';
        return;
    }
    
    letters.forEach((letter, index) => {
        const row = document.createElement('tr');
        const statusClass = getStatusClass(letter.status);
        const statusEmoji = getStatusEmoji(letter.status);
        
        const districtsList = letter.districts ? letter.districts.split(',').map(d => d.trim()).join(', ') : 'N/A';
        
        let actionButtons = `
            <div class="action-buttons">
                ${letter.pdf_file_path ? `
                    <a href="/uploads/${letter.pdf_file_path}" target="_blank" class="btn-sm btn-view-pdf">📄 PDF</a>
                ` : ''}
        `;
        
        if (isLoggedIn()) {
            actionButtons += `
                <button class="btn-sm btn-edit" onclick="editLetter(${letter.id})">✏️ Edit</button>
                <button class="btn-sm btn-delete" onclick="deleteLetter(${letter.id})">🗑️ Delete</button>
            `;
        }
        
        actionButtons += '</div>';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${letter.letter_number}</td>
            <td>${letter.subject.substring(0, 50)}...</td>
            <td>${formatDate(letter.date_of_despatch)}</td>
            <td>${formatDate(letter.deadline)}</td>
            <td><small>${districtsList}</small></td>
            <td><span class="letter-status ${statusClass}">${statusEmoji} ${letter.status}</span></td>
            <td>${formatDate(letter.date_of_reply)}</td>
            <td>${letter.pdf_file_path ? '✅' : '❌'}</td>
            <td>${actionButtons}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function renderPagination(total, page, limit) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    const totalPages = Math.ceil(total / limit);
    
    if (totalPages <= 1) return;
    
    const maxPage = Math.min(page + 2, totalPages);
    const minPage = Math.max(1, page - 2);
    
    if (page > 1) {
        const btn = document.createElement('button');
        btn.textContent = '← Previous';
        btn.onclick = () => {
            currentPage = page - 1;
            loadLetters();
        };
        pagination.appendChild(btn);
    }
    
    for (let i = minPage; i <= maxPage; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = i === page ? 'active' : '';
        btn.onclick = () => {
            currentPage = i;
            loadLetters();
        };
        pagination.appendChild(btn);
    }
    
    if (page < totalPages) {
        const btn = document.createElement('button');
        btn.textContent = 'Next →';
        btn.onclick = () => {
            currentPage = page + 1;
            loadLetters();
        };
        pagination.appendChild(btn);
    }
    
    const info = document.createElement('span');
    info.textContent = `Page ${page} of ${totalPages}`;
    pagination.appendChild(info);
}

function applyFilters() {
    currentPage = 1;
    loadLetters();
}

function resetFilters() {
    document.getElementById('search').value = '';
    document.getElementById('district-filter').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    document.getElementById('records-per-page').value = '25';
    currentPage = 1;
    loadLetters();
}

function editLetter(id) {
    if (!isLoggedIn()) {
        alert('Please login to edit letters');
        showLoginModal();
        return;
    }
    alert('Edit functionality to be implemented in admin panel');
}

async function deleteLetter(id) {
    if (!isLoggedIn()) {
        alert('Please login to delete letters');
        showLoginModal();
        return;
    }
    
    const confirm1 = confirm('Are you sure you want to delete this letter? This action cannot be undone.');
    if (!confirm1) return;
    
    try {
        const result = await apiDeleteLetter(id);
        if (result.success) {
            showNotification('Letter deleted successfully', 'success');
            loadLetters();
        }
    } catch (error) {
        showNotification('Error deleting letter: ' + error.message, 'error');
    }
}

function exportToExcel() {
    if (allLetters.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    let csv = 'SL. No.,Letter Number,Subject,Despatch Date,Deadline,Districts,Status,Reply Date\n';
    
    allLetters.forEach((letter, index) => {
        const districts = letter.districts ? letter.districts.split(',').join('; ') : 'N/A';
        csv += [
            index + 1,
            letter.letter_number,
            '"' + letter.subject.replace(/"/g, '""') + '"',
            formatDate(letter.date_of_despatch),
            formatDate(letter.deadline),
            '"' + districts + '"',
            letter.status,
            formatDate(letter.date_of_reply) || ''
        ].join(',') + '\n';
    });
    
    downloadCSV(csv, 'TRLM_Letters.csv');
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadLetters();
    
    // Add search with Enter key
    document.getElementById('search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
});
