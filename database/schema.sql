-- TRLM Letter Tracking Database Schema
-- Created: 2026-02-06

-- Create database
CREATE DATABASE IF NOT EXISTS trlm_dashboard;
USE trlm_dashboard;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS letter_districts;
DROP TABLE IF EXISTS letters;
DROP TABLE IF EXISTS users;

-- Table 1: Users (Admin Authentication)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: Letters
CREATE TABLE letters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sl_no VARCHAR(20) UNIQUE NOT NULL,
    letter_number VARCHAR(50) UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    date_of_despatch DATE NOT NULL,
    deadline DATE NOT NULL,
    date_of_reply DATE NULL,
    status ENUM('Fast', 'On Time', 'Late', 'Waiting') DEFAULT 'Waiting',
    pdf_file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    last_modified_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    INDEX idx_letter_number (letter_number),
    INDEX idx_status (status),
    INDEX idx_deadline (deadline),
    INDEX idx_date_of_despatch (date_of_despatch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: Letter Districts (Many-to-Many Relationship)
CREATE TABLE letter_districts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    letter_id INT NOT NULL,
    district_name ENUM(
        'North Tripura', 
        'Unakoti', 
        'Dhalai', 
        'Khowai', 
        'West Tripura', 
        'Sepahijala', 
        'Gomati', 
        'South Tripura'
    ) NOT NULL,
    FOREIGN KEY (letter_id) REFERENCES letters(id) ON DELETE CASCADE,
    INDEX idx_district (district_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 4: Activity Log (Audit Trail)
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
    letter_id INT NULL,
    action_details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (letter_id) REFERENCES letters(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (Password: FARM123@#)
-- Password hash for FARM123@# (bcrypt with 10 rounds)
INSERT INTO users (username, email, password_hash) VALUES 
(
    'TRLM_FarmLH',
    'admin@trlm.gov.in',
    '$2a$10$0TgKdJbvLT7XMYdLFMZjCOd7PqPYVUPl5YQV7xQpD5JZWKqf8ZD0O'
);

-- Insert sample data for demonstration
INSERT INTO letters (sl_no, letter_number, subject, date_of_despatch, deadline, date_of_reply, status, created_by, last_modified_by) VALUES 
(
    '001',
    'TRL/2026/001',
    'Budget Allocation for Agricultural Training Program',
    '2026-01-15',
    '2026-02-01',
    '2026-01-28',
    'Fast',
    'TRLM_FarmLH',
    'TRLM_FarmLH'
),
(
    '002',
    'TRL/2026/002',
    'Staff Development Training Materials',
    '2026-01-20',
    '2026-02-05',
    '2026-02-03',
    'Fast',
    'TRLM_FarmLH',
    'TRLM_FarmLH'
),
(
    '003',
    'TRL/2026/003',
    'Quarterly Audit Report and Compliance Check',
    '2026-01-22',
    '2026-02-10',
    '2026-02-09',
    'On Time',
    'TRLM_FarmLH',
    'TRLM_FarmLH'
),
(
    '004',
    'TRL/2026/004',
    'Financial Database and Record Submission',
    '2026-01-10',
    '2026-01-28',
    NULL,
    'Late',
    'TRLM_FarmLH',
    'TRLM_FarmLH'
),
(
    '005',
    'TRL/2026/005',
    'Infrastructure Development Project Details',
    '2026-01-25',
    '2026-02-15',
    NULL,
    'Waiting',
    'TRLM_FarmLH',
    'TRLM_FarmLH'
),
(
    '006',
    'TRL/2026/006',
    'District-wise Performance Analysis',
    '2026-01-18',
    '2026-02-08',
    '2026-02-06',
    'On Time',
    'TRLM_FarmLH',
    'TRLM_FarmLH'
);

-- Insert districts for each letter
INSERT INTO letter_districts (letter_id, district_name) VALUES 
(1, 'North Tripura'),
(1, 'Unakoti'),
(2, 'West Tripura'),
(3, 'Dhalai'),
(4, 'Sepahijala'),
(5, 'Khowai'),
(5, 'West Tripura'),
(6, 'Gomati');
