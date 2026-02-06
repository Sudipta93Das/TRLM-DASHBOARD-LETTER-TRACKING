// server/db.js - SQLite Database Setup
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/trlm.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
        process.exit(1);
    } else {
        console.log('✅ SQLite Database connected');
        initializeDatabase();
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

function initializeDatabase() {
    db.serialize(() => {
        // Create users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create letters table
        db.run(`
            CREATE TABLE IF NOT EXISTS letters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sl_no VARCHAR(20) UNIQUE NOT NULL,
                letter_number VARCHAR(50) UNIQUE NOT NULL,
                subject TEXT NOT NULL,
                date_of_despatch DATE NOT NULL,
                deadline DATE NOT NULL,
                date_of_reply DATE,
                status VARCHAR(20) DEFAULT 'Waiting',
                pdf_file_path VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by VARCHAR(100),
                last_modified_by VARCHAR(100),
                is_deleted INTEGER DEFAULT 0,
                deleted_at DATETIME
            )
        `);

        // Create letter_districts table
        db.run(`
            CREATE TABLE IF NOT EXISTS letter_districts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                letter_id INTEGER NOT NULL,
                district_name VARCHAR(100) NOT NULL,
                FOREIGN KEY (letter_id) REFERENCES letters(id) ON DELETE CASCADE
            )
        `);

        // Create activity_log table
        db.run(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                action_type VARCHAR(50) NOT NULL,
                letter_id INTEGER,
                action_details TEXT,
                ip_address VARCHAR(45),
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (letter_id) REFERENCES letters(id) ON DELETE SET NULL
            )
        `);

        // Create admin user if not exists
        createAdminUser();
    });
}

function createAdminUser() {
    const bcrypt = require('bcryptjs');
    const username = process.env.ADMIN_USERNAME || 'TRLM_FarmLH';
    const password = process.env.ADMIN_PASSWORD || 'FARM123@#';
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.error('Error checking admin user:', err);
            return;
        }

        if (!row) {
            db.run(
                'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
                [username, hashedPassword, 'admin@trlm.gov.in'],
                (err) => {
                    if (err) {
                        console.error('Error creating admin user:', err);
                    } else {
                        console.log('✅ Admin user created successfully');
                    }
                }
            );
        } else {
            console.log('✅ Admin user already exists');
        }
    });
}

// Promise-based wrappers
const db_run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

const db_get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const db_all = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

module.exports = {
    db,
    db_run,
    db_get,
    db_all
};
