// server/app.js - Complete Express Application with SQLite
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const ExcelJS = require('exceljs');
const fs = require('fs');
require('dotenv').config();

const { db, db_run, db_get, db_all } = require('./db');
const { verifyToken, generateToken, comparePassword, hashPassword, authMiddleware } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// File upload configuration
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});

// ==================== AUTHENTICATION ROUTES ====================

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await db_get(
            'SELECT id, username, password_hash FROM users WHERE username = ?',
            [username]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isPasswordValid = await comparePassword(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Update last login
        await db_run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        // Log activity
        await db_run(
            'INSERT INTO activity_log (user_id, action_type, ip_address) VALUES (?, ?, ?)',
            [user.id, 'LOGIN', req.ip || 'unknown']
        );

        const token = generateToken(user.id, user.username);
        res.json({ success: true, token, username: user.username });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
    res.json({ valid: true, user: req.user });
});

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
    try {
        await db_run(
            'INSERT INTO activity_log (user_id, action_type, ip_address) VALUES (?, ?, ?)',
            [req.user.userId, 'LOGOUT', req.ip || 'unknown']
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== LETTER ROUTES ====================

// Get all letters with filters
app.get('/api/letters', async (req, res) => {
    try {
        const { status, district, search, page = 1, limit = 25 } = req.query;
        let query = `SELECT DISTINCT l.*, 
            (SELECT GROUP_CONCAT(district_name) FROM letter_districts WHERE letter_id = l.id) as districts
            FROM letters l WHERE l.is_deleted = 0`;
        let params = [];

        if (status) {
            query += ' AND l.status = ?';
            params.push(status);
        }

        if (district) {
            query += ` AND l.id IN (SELECT letter_id FROM letter_districts WHERE district_name = ?)`;
            params.push(district);
        }

        if (search) {
            query += ' AND (l.letter_number LIKE ? OR l.subject LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY l.date_of_despatch DESC';

        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

        const letters = await db_all(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(DISTINCT l.id) as total FROM letters l WHERE l.is_deleted = 0';
        if (status) countQuery += ' AND l.status = ?';
        if (district) countQuery += ` AND l.id IN (SELECT letter_id FROM letter_districts WHERE district_name = ?)`;
        if (search) countQuery += ' AND (l.letter_number LIKE ? OR l.subject LIKE ?)';

        const countResult = await db_get(countQuery, params);

        res.json({
            data: letters,
            total: countResult.total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Error fetching letters:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single letter
app.get('/api/letters/:id', async (req, res) => {
    try {
        const letter = await db_get(
            'SELECT * FROM letters WHERE id = ? AND is_deleted = 0',
            [req.params.id]
        );

        if (!letter) {
            return res.status(404).json({ error: 'Letter not found' });
        }

        const districts = await db_all(
            'SELECT district_name FROM letter_districts WHERE letter_id = ?',
            [req.params.id]
        );

        letter.districts = districts.map(d => d.district_name);
        res.json(letter);
    } catch (error) {
        console.error('Error fetching letter:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Calculate status based on dates
function calculateStatus(despatchDate, deadline, replyDate) {
    if (!replyDate) return 'Waiting';
    
    const despatch = new Date(despatchDate);
    const reply = new Date(replyDate);
    const dead = new Date(deadline);
    
    const responseTime = Math.ceil((reply - despatch) / (1000 * 60 * 60 * 24));
    
    if (responseTime <= 3) return 'Fast';
    if (reply <= dead) return 'On Time';
    return 'Late';
}

// Create letter (Admin only)
app.post('/api/letters', authMiddleware, upload.single('pdf'), async (req, res) => {
    try {
        const { sl_no, letter_number, subject, date_of_despatch, deadline, date_of_reply, districts } = req.body;
        const pdfPath = req.file ? req.file.filename : null;

        if (!sl_no || !letter_number || !subject || !date_of_despatch || !deadline) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existing = await db_get(
            'SELECT id FROM letters WHERE letter_number = ? AND is_deleted = 0',
            [letter_number]
        );

        if (existing) {
            return res.status(400).json({ error: 'Letter number already exists' });
        }

        const status = calculateStatus(date_of_despatch, deadline, date_of_reply);

        const result = await db_run(
            `INSERT INTO letters (sl_no, letter_number, subject, date_of_despatch, deadline, date_of_reply, status, pdf_file_path, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sl_no, letter_number, subject, date_of_despatch, deadline, date_of_reply || null, status, pdfPath, req.user.username]
        );

        const districtArray = Array.isArray(districts) ? districts : [districts];
        for (const district of districtArray) {
            if (district) {
                await db_run(
                    'INSERT INTO letter_districts (letter_id, district_name) VALUES (?, ?)',
                    [result.id, district]
                );
            }
        }

        // Log activity
        await db_run(
            'INSERT INTO activity_log (user_id, action_type, letter_id, action_details, ip_address) VALUES (?, ?, ?, ?, ?)',
            [req.user.userId, 'CREATE', result.id, `Created letter ${letter_number}`, req.ip || 'unknown']
        );

        res.status(201).json({ success: true, id: result.id, message: 'Letter created successfully' });
    } catch (error) {
        console.error('Error creating letter:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update letter (Admin only)
app.put('/api/letters/:id', authMiddleware, upload.single('pdf'), async (req, res) => {
    try {
        const { id } = req.params;
        const { sl_no, letter_number, subject, date_of_despatch, deadline, date_of_reply, districts } = req.body;

        const letter = await db_get('SELECT * FROM letters WHERE id = ? AND is_deleted = 0', [id]);
        if (!letter) {
            return res.status(404).json({ error: 'Letter not found' });
        }

        if (letter_number !== letter.letter_number) {
            const duplicate = await db_get(
                'SELECT id FROM letters WHERE letter_number = ? AND id != ? AND is_deleted = 0',
                [letter_number, id]
            );
            if (duplicate) {
                return res.status(400).json({ error: 'Letter number already exists' });
            }
        }

        const status = calculateStatus(date_of_despatch, deadline, date_of_reply);
        const pdfPath = req.file ? req.file.filename : letter.pdf_file_path;

        await db_run(
            `UPDATE letters SET sl_no = ?, letter_number = ?, subject = ?, date_of_despatch = ?, deadline = ?, 
             date_of_reply = ?, status = ?, pdf_file_path = ?, last_modified_by = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [sl_no, letter_number, subject, date_of_despatch, deadline, date_of_reply || null, status, pdfPath, req.user.username, id]
        );

        await db_run('DELETE FROM letter_districts WHERE letter_id = ?', [id]);
        const districtArray = Array.isArray(districts) ? districts : [districts];
        for (const district of districtArray) {
            if (district) {
                await db_run(
                    'INSERT INTO letter_districts (letter_id, district_name) VALUES (?, ?)',
                    [id, district]
                );
            }
        }

        await db_run(
            'INSERT INTO activity_log (user_id, action_type, letter_id, action_details, ip_address) VALUES (?, ?, ?, ?, ?)',
            [req.user.userId, 'UPDATE', id, `Updated letter ${letter_number}`, req.ip || 'unknown']
        );

        res.json({ success: true, message: 'Letter updated successfully' });
    } catch (error) {
        console.error('Error updating letter:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete letter (Admin only)
app.delete('/api/letters/:id', authMiddleware, async (req, res) => {
    try {
        const letter = await db_get('SELECT * FROM letters WHERE id = ? AND is_deleted = 0', [req.params.id]);
        if (!letter) {
            return res.status(404).json({ error: 'Letter not found' });
        }

        await db_run(
            'UPDATE letters SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, last_modified_by = ? WHERE id = ?',
            [req.user.username, req.params.id]
        );

        await db_run(
            'INSERT INTO activity_log (user_id, action_type, letter_id, action_details, ip_address) VALUES (?, ?, ?, ?, ?)',
            [req.user.userId, 'DELETE', req.params.id, `Deleted letter ${letter.letter_number}`, req.ip || 'unknown']
        );

        res.json({ success: true, message: 'Letter deleted successfully' });
    } catch (error) {
        console.error('Error deleting letter:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== ANALYTICS ROUTES ====================

app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        const stats = await db_get(`
            SELECT 
                COUNT(*) as total_letters,
                SUM(CASE WHEN status != 'Waiting' THEN 1 ELSE 0 END) as replied_letters,
                SUM(CASE WHEN status = 'Waiting' THEN 1 ELSE 0 END) as pending_letters,
                SUM(CASE WHEN status = 'Fast' THEN 1 ELSE 0 END) as fast_replies,
                SUM(CASE WHEN status = 'On Time' THEN 1 ELSE 0 END) as on_time_replies,
                SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_replies
            FROM letters WHERE is_deleted = 0
        `);

        const warnings = await db_get(`
            SELECT 
                SUM(CASE WHEN deadline < date('now') AND date_of_reply IS NULL THEN 1 ELSE 0 END) as overdue,
                SUM(CASE WHEN deadline >= date('now') AND deadline <= date('now', '+7 days') AND date_of_reply IS NULL THEN 1 ELSE 0 END) as due_soon,
                SUM(CASE WHEN deadline > date('now', '+7 days') AND date_of_reply IS NULL THEN 1 ELSE 0 END) as pending
            FROM letters WHERE is_deleted = 0
        `);

        res.json({ statistics: stats, warnings });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/analytics/districts', async (req, res) => {
    try {
        const districtStats = await db_all(`
            SELECT 
                ld.district_name,
                COUNT(DISTINCT l.id) as total_letters,
                SUM(CASE WHEN l.status = 'On Time' THEN 1 ELSE 0 END) as on_time,
                SUM(CASE WHEN l.status = 'Fast' THEN 1 ELSE 0 END) as fast,
                SUM(CASE WHEN l.status = 'Late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN l.status = 'Waiting' THEN 1 ELSE 0 END) as waiting,
                ROUND(CAST(SUM(CASE WHEN l.status IN ('On Time', 'Fast') THEN 1 ELSE 0 END) AS FLOAT) / COUNT(DISTINCT l.id) * 100, 2) as efficiency
            FROM letters l
            LEFT JOIN letter_districts ld ON l.id = ld.letter_id
            WHERE l.is_deleted = 0
            GROUP BY ld.district_name
            ORDER BY efficiency DESC
        `);

        res.json(districtStats);
    } catch (error) {
        console.error('Error fetching district analytics:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/analytics/warnings', async (req, res) => {
    try {
        const warnings = await db_all(`
            SELECT 
                l.id,
                l.letter_number,
                l.subject,
                l.deadline,
                l.date_of_reply,
                l.date_of_despatch,
                (SELECT GROUP_CONCAT(district_name) FROM letter_districts WHERE letter_id = l.id) as districts,
                CASE 
                    WHEN l.date_of_reply IS NOT NULL AND l.date_of_reply > l.deadline THEN 'LATE'
                    WHEN l.deadline < date('now') AND l.date_of_reply IS NULL THEN 'OVERDUE'
                    WHEN julianday(l.deadline) - julianday('now') BETWEEN 0 AND 1 THEN 'URGENT'
                    WHEN julianday(l.deadline) - julianday('now') BETWEEN 1 AND 7 THEN 'DUE_SOON'
                    ELSE 'PENDING'
                END as warning_level,
                CAST((julianday(l.deadline) - julianday('now')) AS INTEGER) as days_to_deadline
            FROM letters l
            WHERE l.is_deleted = 0
            ORDER BY days_to_deadline ASC
        `);

        res.json(warnings);
    } catch (error) {
        console.error('Error fetching warnings:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/activity-log', authMiddleware, async (req, res) => {
    try {
        const logs = await db_all(`
            SELECT 
                al.id,
                al.user_id,
                u.username,
                al.action_type,
                al.letter_id,
                al.action_details,
                al.ip_address,
                al.timestamp
            FROM activity_log al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.timestamp DESC
            LIMIT 500
        `);

        res.json(logs);
    } catch (error) {
        console.error('Error fetching activity log:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== EXPORT ROUTES ====================

app.get('/api/export/excel', async (req, res) => {
    try {
        const letters = await db_all('SELECT * FROM letters WHERE is_deleted = 0 ORDER BY date_of_despatch DESC');
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Letters');

        worksheet.columns = [
            { header: 'SL. No', key: 'sl_no', width: 10 },
            { header: 'Letter Number', key: 'letter_number', width: 15 },
            { header: 'Subject', key: 'subject', width: 30 },
            { header: 'Date of Despatch', key: 'date_of_despatch', width: 15 },
            { header: 'Deadline', key: 'deadline', width: 15 },
            { header: 'Reply Date', key: 'date_of_reply', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Created By', key: 'created_by', width: 15 }
        ];

        worksheet.headerRow = 1;
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

        for (const letter of letters) {
            const row = worksheet.addRow(letter);
            const statusCell = row.getCell('status');
            
            switch (letter.status) {
                case 'Fast':
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
                    break;
                case 'On Time':
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBDD7EE' } };
                    break;
                case 'Late':
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
                    break;
                case 'Waiting':
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
                    break;
            }
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=TRLM_Letters_' + new Date().getTime() + '.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// PDF download route
app.get('/api/download/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(__dirname, '../uploads', filename);
        
        if (!fs.existsSync(filepath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.download(filepath);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✨ TRLM Letter Tracking Dashboard running on http://localhost:${PORT}`);
    console.log(`📊 Admin Panel: Use credentials TRLM_FarmLH / FARM123@#`);
});
