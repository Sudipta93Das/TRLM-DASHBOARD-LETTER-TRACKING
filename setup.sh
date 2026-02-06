#!/bin/bash
# setup.sh - Database initialization script for TRLM Dashboard

echo "🚀 Setting up TRLM Letter Tracking Dashboard..."

# Create database directory
mkdir -p database
mkdir -p uploads

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Initialize database with sample data
echo "🗄️  Initializing database..."
node -e "
const { db, db_run, db_get } = require('./server/db');
const bcrypt = require('bcryptjs');

// Sample data
const sampleLetters = [
    { sl_no: '1', letter_number: 'TRL/2026/001', subject: 'Budget Approval Request', despatch: '2026-01-15', deadline: '2026-02-01', reply: null, districts: ['North Tripura', 'Unakoti'] },
    { sl_no: '2', letter_number: 'TRL/2026/002', subject: 'Staff Training Schedule', despatch: '2026-01-20', deadline: '2026-02-05', reply: '2026-01-28', districts: ['West Tripura'] },
    { sl_no: '3', letter_number: 'TRL/2026/003', subject: 'Audit Report Submission', despatch: '2026-01-22', deadline: '2026-02-10', reply: null, districts: ['Dhalai'] },
    { sl_no: '4', letter_number: 'TRL/2026/004', subject: 'Financial Data Request', despatch: '2026-01-10', deadline: '2026-01-28', reply: '2026-02-05', districts: ['Sepahijala'] },
    { sl_no: '5', letter_number: 'TRL/2026/005', subject: 'Infrastructure Development Plan', despatch: '2026-01-25', deadline: '2026-02-15', reply: null, districts: ['Khowai', 'Gomati'] }
];

async function initDB() {
    try {
        // Insert sample letters
        for (const letter of sampleLetters) {
            try {
                await db_run(
                    \`INSERT INTO letters (sl_no, letter_number, subject, date_of_despatch, deadline, date_of_reply, created_by)
                     VALUES (?, ?, ?, ?, ?, ?, 'admin')\`,
                    [letter.sl_no, letter.letter_number, letter.subject, letter.despatch, letter.deadline, letter.reply]
                );
                
                // Get the last inserted ID
                const result = await db_get('SELECT last_insert_rowid() as id');
                const letterId = result['last_insert_rowid()'];
                
                // Insert districts
                for (const district of letter.districts) {
                    await db_run(
                        'INSERT INTO letter_districts (letter_id, district_name) VALUES (?, ?)',
                        [letterId, district]
                    );
                }
            } catch (e) {
                // Ignore duplicates
            }
        }
        console.log('✅ Sample data initialized');
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

initDB();
"

echo "✨ Setup complete!"
echo "🚀 Starting server..."
echo ""
echo "📊 Admin Credentials:"
echo "Username: TRLM_FarmLH"
echo "Password: FARM123@#"
echo ""
echo "🌐 Access the dashboard at: http://localhost:3000"
