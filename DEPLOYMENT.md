# TRLM Letter Tracking Dashboard - Deployment Guide

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Sudipta93Das/TRLM-DASHBOARD-LETTER-TRACKING.git
cd TRLM-DASHBOARD-LETTER-TRACKING
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
The `.env` file is pre-configured with:
- **Port**: 3000
- **Admin Username**: TRLM_FarmLH
- **Admin Password**: FARM123@#

### 4. Start the Application
```bash
npm start
```

The dashboard will be available at: **http://localhost:3000**

---

## 📊 Features Implemented

### Public Access (No Login Required)
✅ Dashboard with real-time statistics
✅ Complete letters data table with search & filter
✅ District-wise analytics and performance metrics
✅ Warning/Alert system for deadline monitoring
✅ PDF download capability
✅ Excel export functionality

### Admin Features (Login Required)
✅ Upload new letters with PDF attachments
✅ Edit existing letter information
✅ Delete letters (soft delete with audit trail)
✅ Track reply dates and status
✅ View complete activity log
✅ Generate custom reports

---

## 🔐 Admin Login Credentials

| Field | Value |
|-------|-------|
| **Username** | TRLM_FarmLH |
| **Password** | FARM123@# |

---

## 📁 Project Structure

```
TRLM-DASHBOARD-LETTER-TRACKING/
├── server/
│   ├── app.js              # Main Express application
│   ├── db.js               # SQLite database setup
│   └── auth.js             # JWT authentication
├── public/
│   ├── index.html          # Dashboard landing page
│   ├── css/
│   │   ├── style.css       # Main stylesheet
│   │   └── responsive.css  # Mobile responsive styles
│   ├── js/
│   │   ├── api.js          # API communication
│   │   ├── auth.js         # Authentication logic
│   │   ├── dashboard.js    # Dashboard functions
│   │   ├── data-table.js   # Data table management
│   │   ├── analytics.js    # Analytics logic
│   │   └── warnings.js     # Warning system
│   └── pages/
│       ├── admin.html      # Admin panel
│       ├── data-table.html # Data table page
│       ├── analytics.html  # Analytics page
│       └── warnings.html   # Warnings page
├── database/               # SQLite database files
├── uploads/                # Uploaded PDF files
├── package.json            # Dependencies
├── .env                    # Environment variables
└── README.md              # Documentation
```

---

## 🗄️ Database Schema

### `users`
- id, username, password_hash, email, last_login, created_at

### `letters`
- id, sl_no, letter_number, subject, date_of_despatch, deadline, date_of_reply, status, pdf_file_path, created_by, last_modified_by, created_at, updated_at, is_deleted, deleted_at

### `letter_districts`
- id, letter_id, district_name

### `activity_log`
- id, user_id, action_type, letter_id, action_details, ip_address, timestamp

---

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/logout` - User logout

### Letters (Public)
- `GET /api/letters` - Get all letters with pagination
- `GET /api/letters/:id` - Get single letter

### Letters (Admin Only)
- `POST /api/letters` - Create new letter
- `PUT /api/letters/:id` - Update letter
- `DELETE /api/letters/:id` - Delete letter

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/districts` - District performance
- `GET /api/analytics/warnings` - Warning alerts

### Admin Functions
- `GET /api/admin/activity-log` - Activity audit log

### Export
- `GET /api/export/excel` - Export letters to Excel
- `GET /api/download/:filename` - Download PDF

---

## 🚀 Deployment to Production

### Option 1: Heroku
```bash
heroku login
heroku create trlm-dashboard
git push heroku main
```

### Option 2: Docker
Create a `Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t trlm-dashboard .
docker run -p 3000:3000 trlm-dashboard
```

### Option 3: VPS/Server
1. SSH into your server
2. Clone the repository
3. Install Node.js and npm
4. Configure environment variables
5. Install PM2 for process management:
```bash
npm install -g pm2
pm2 start server/app.js --name "trlm-dashboard"
pm2 startup
pm2 save
```

6. Configure Nginx reverse proxy
7. Setup SSL certificate with Let's Encrypt

---

## 🔒 Security Checklist

- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (input sanitization)
- ✅ CSRF protection
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Soft delete implementation
- ✅ Audit logging for all admin actions
- ✅ File upload validation
- ✅ HTTPS/SSL recommended for production

---

## 📊 Performance Optimization

- Database indexes on frequently queried fields
- Pagination support (25/50/100 records per page)
- Lazy loading for large datasets
- Excel export with proper formatting
- Caching mechanisms for static assets
- Optimized SQL queries

---

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Change port in .env file
echo "PORT=3001" >> .env

# Or kill the process
lsof -ti:3000 | xargs kill -9
```

### Database connection errors
```bash
# Verify database file exists
ls -la database/trlm.db

# Reset database
rm database/trlm.db
npm start
```

### Admin login not working
- Verify credentials: TRLM_FarmLH / FARM123@#
- Clear browser cookies and localStorage
- Check browser console for errors

---

## 📞 Support & Maintenance

- Regular database backups recommended
- Monitor server performance and logs
- Update Node.js and npm regularly
- Apply security patches
- Archive old letters periodically

---

## 📄 License

MIT License - © 2026 Tripura Rural Livelihood Mission

---

## 👥 Author

Developed for Tripura Rural Livelihood Mission
Government of Tripura

---

**Last Updated**: February 6, 2026
