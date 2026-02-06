# TRLM Letter Tracking & Analytics Dashboard

A comprehensive web-based application for tracking inter-district correspondence with real-time deadline monitoring, advanced analytics, and accountability reporting for the Tripura Rural Livelihood Mission.

## 🎯 Features

### Public Access (View-Only)
- ✅ **Dashboard**: Overview of letter statistics and warning alerts
- ✅ **Data Table**: Search and filter all letters with pagination
- ✅ **Analytics**: District-wise performance analysis and trends
- ✅ **Warnings**: Real-time deadline alerts and monitoring
- ✅ **PDF Viewing**: Download letter PDFs
- ✅ **Excel Export**: Export reports in Excel format

### Admin Panel (Login Required)
**Credentials**: `TRLM_FarmLH` / `FARM123@#`

- ✅ **Upload Letters**: Add new letters with PDF attachments
- ✅ **Edit Letters**: Modify letter details and deadlines
- ✅ **Delete Letters**: Soft delete with audit trail
- ✅ **Track Replies**: Record and manage reply dates
- ✅ **Activity Log**: Complete audit trail of all actions
- ✅ **Custom Reports**: Generate customized analytics reports

## 🏗️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Export**: Excel (.xlsx) support

## 📋 System Requirements

- Node.js v14+ 
- npm v6+
- 100MB disk space
- Modern web browser

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
cd /workspaces/TRLM-DASHBOARD-LETTER-TRACKING
npm install
```

### 2. Start the Application
```bash
npm start
```

The dashboard will be available at: `http://localhost:3000`

### 3. Default Admin Credentials
- **Username**: `TRLM_FarmLH`
- **Password**: `FARM123@#`

## 📊 Dashboard Features

### Homepage
- Total letters counter
- Replied vs. pending statistics
- Quick warning alerts (Overdue, Due Soon, Pending)
- Recent 10 letters
- Average response time

### Data Table
- Search by letter number or subject
- Filter by status and district
- Sort by any column
- Pagination support
- PDF download option
- Admin: Edit/Delete buttons

### Analytics
- District-wise performance metrics
- Efficiency scores
- Visual charts and graphs
- Monthly trends
- Exportable reports

### Warnings System
- **Overdue** (🔴 Red): Immediate action needed
- **Due Soon** (🟡 Yellow): 1-7 days remaining
- **Pending** (🟢 Green): >7 days remaining
- Real-time updates

## 🔐 Security

- JWT-based authentication
- Bcrypt password hashing
- Soft delete (data recovery)
- Complete audit logging
- SQL injection prevention
- XSS protection

## 📁 Project Structure

```
├── server/
│   ├── app.js          # Express application
│   ├── auth.js         # Authentication
│   └── db.js           # Database setup
├── public/
│   ├── index.html      # Dashboard
│   ├── css/            # Stylesheets
│   ├── js/             # Client-side scripts
│   └── pages/          # Additional pages
├── database/           # SQLite database
├── uploads/            # PDF storage
└── package.json
```

## 📈 Status Calculation

- **Fast**: Reply within 3 days
- **On Time**: Reply before deadline
- **Late**: Reply after deadline
- **Waiting**: No reply yet

## 💾 Database

Uses SQLite3 with 4 main tables:
- `users` - Admin credentials
- `letters` - Letter tracking
- `letter_districts` - District mapping
- `activity_log` - Audit trail

## 📥 Export Options

- Complete letters database (Excel)
- District analytics (Multi-sheet)
- Warning reports
- Activity logs

## 🛠️ Troubleshooting

```bash
# Port in use
lsof -i :3000

# Reset database
rm database/trlm.db
npm start

# Check logs
tail -f server/app.log
```

## 📱 Responsive Design

- ✅ Desktop (1200px+)
- ✅ Tablet (768px-1199px)
- ✅ Mobile (<768px)

## 🎨 Government Theme

- Saffron (#FF9933) & Navy (#000080)
- Green (#28A745) for success
- Red (#DC3545) for alerts

## 📞 Support

For issues or questions, contact: admin@trlm.gov.in

---

**Built with ❤️ for Tripura Rural Livelihood Mission**
© 2026 Government of Tripura
