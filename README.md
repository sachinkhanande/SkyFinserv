# 🏦 SkyFinserv — Loan Origination & Management System

> A full-stack **Loan Origination Desk (LOD)** built with **Node.js**, **Express**, **MySQL** and vanilla **HTML/CSS/JS** — designed for DSAs (Direct Selling Agents), loan consultants, and financial intermediaries to manage the complete loan lifecycle from application intake to disbursement tracking.

![SkyFinserv](https://img.shields.io/badge/SkyFinserv-Loan%20Origination%20Desk-F5A623?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEyIDJMMiA3bDEwIDUgMTAtNUwxMiAyek0yIDE3bDEwIDUgMTAtNS0xMC01LTEwIDV6Ii8+PC9zdmc+)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Database Schema](#️-database-schema)
- [Quick Start](#-quick-start)
- [Environment Variables](#️-environment-variables)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Security](#-security)
- [License](#-license)

---

## 🌟 Overview

SkyFinserv is a comprehensive loan origination and management platform built for financial professionals. It streamlines every step of the loan process:

```
Borrower KYC  →  Loan Application  →  Bank Eligibility Check  →  Bank Assignment  →  Disbursement Tracking
```

Whether you are a DSA, loan consultant, NBFC, or financial intermediary, SkyFinserv gives you a single dashboard to manage borrowers, loan applications, bank products, eligibility scoring, and disbursement tracking — all without spreadsheets.

---

## 📸 Screenshots

| Module | Description |
|--------|-------------|
| **Apply Form** | Public loan application with 13+ loan types, dynamic KYC fields |
| **Bank Assignment** | Smart recommendation engine with match scores, eligibility checks |
| **Admin Panel** | Application tracking, export, audit log, status management |
| **Data Manager** | Spreadsheet-style loan processing tracker with Excel export |
| **Loan Type Manager** | Full CRUD for loan types and subcategories with parameters |

---

## ✨ Features

### 🖊️ Public Loan Application Portal
- Multi-loan-type form supporting **13+ loan categories**:
  - Home Loan (HL), Business Loan (BL), Loan Against Property (LAP)
  - Personal Loan (PL), Gold Loan (GL), Auto Loan (Auto.L)
  - DropLine Over Draft (DLOD), Cash Credit / Working Credit (CC/WC)
  - Education Loan (EL), Govt. Loan MSME (CGTMSME)
  - Medical Equipment Loan (MEL), Project Loan (Pro.L), Commercial Vehicle Loan (Comm.V)
- Dynamic fields based on applicant type (**Salaried** vs **Business/Self-Employed**)
- PAN & Aadhaar availability tracking with alternate document guidance (Form 16A / 26AS)
- All fields optional — submit with whatever is available
- Aadhaar encrypted with **AES-256-GCM** before database storage

### 🏦 Bank Assignment Module
- **Smart recommendation engine** scoring bank products (0–100%) based on:
  - CIBIL score, monthly income, FOIR, LTV ratio, loan amount limits
- Side-by-side product comparison with badges:
  - 🏆 Best Match · 💰 Lowest ROI · 📉 Lowest EMI
- **Eligibility Check modal** — criterion-by-criterion pass/fail report
- One-click bank assignment with full status tracking:
  - `Pending → Submitted → Approved → Rejected → Disbursed`
- Assignment detail fields: ROI, EMI, Sanction Amount, Processing Fee, Login Date, Decision Date, Disbursement Date, Connector, RM Name, Remarks

### 👤 Unified Borrower & Application Form
- **Single form** — create borrower profile + loan application in one step
- Existing borrower lookup — select saved profile to skip re-entry
- Borrower financial profiling: CIBIL, income, existing EMI, FOIR, LTV
- Multiple applications per borrower with independent bank recommendations

### 📂 Loan Type & Subcategory Manager
- Full **CRUD** for 13 default loan types with custom icons and sort order
- **Unlimited subcategories** per loan type. Example — Home Loan subcategories:
  - Home Purchase Loan, Home Construction Loan, Home Extension Loan
  - Home Renovation Loan, Balance Transfer, Top-Up Loan, NRI Home Loan, PMAY
- Each subcategory stores complete product parameters:

| Parameter | Description |
|-----------|-------------|
| Interest Rate (Min/Max) | Rate of interest range |
| Processing Fee | Percentage or fixed amount |
| Max Loan Amount | Maximum sanctionable amount |
| Loan Tenure | Maximum months (up to 360) |
| Prepayment Charges | Prepayment penalty terms |
| Foreclosure Charges | Early closure penalty |
| Approval Time | Typical turnaround time |
| LTV Ratio | Loan to Value ratio % |
| Min CIBIL Score | Minimum credit score required |
| Eligibility Notes | Custom eligibility criteria |
| Documents Required | Required document list |
| Special Features | Unique product features |

### 🏛️ Bank & Product Master
- CRUD for **banks and NBFCs** with brand color, logo initials, bank type
- Bank types: Bank, NBFC, HFC, Co-operative, Small Finance Bank, MFI
- **Product matrix** linking banks to loan types with full eligibility parameters
- 12 banks pre-seeded: HDFC, SBI, ICICI, Axis, Kotak, PNB, BOB, IDFC, Bajaj Finance, Tata Capital, Aditya Birla Finance, LIC HF
- Inline add/edit/delete with live logo preview and color picker

### 📊 Data Manager
- Spreadsheet-style tracker for **30 loan processing fields** per record
- Key fields: Month, Entity, Connector, Applicant, Business/Employer, Category, Bank/NBFC, RM Name, Product, Fresh/BT/TopUp, Credit Program, Login Date, Applied Amount, Decision, Sanctioned Amount, Disbursement Date, Disbursement Amount, LI, GI, PF, ROI, EMI, Tenure, PDC Amount, PDC Date, App ID, NOI Date, Queries/Conditions, Remark
- Real-time search across all fields
- Export to **Excel (.xlsx)** with formatted headers

### 🔐 Admin Panel
- Secure login with **bcrypt** password hashing
- Role-based access: **Admin** / **SuperAdmin**
- Applications list with:
  - Search by name, app number, PAN
  - Filter by loan type, status, date range
  - Aadhaar masking with reveal logging
  - Status update pipeline
  - Export to CSV and Excel
- **Audit Log** — every admin action tracked:
  - View, Status Change, Aadhaar Reveal, Export, Delete, Import
  - Timestamp, Admin username, Action type, Detail, IP address
  - Clear All Logs or delete individual entries
- Change username and password from admin panel

### 🔎 Admin Search
- Cross-field instant search: borrower name, app number, mobile, PAN, loan type
- Results show CIBIL score, income, bank count, approved count, status
- One-click jump to application detail with bank recommendations

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | v18+ |
| **Framework** | Express.js | ^4.18 |
| **Database** | MySQL | 8.0+ |
| **DB Driver** | mysql2 | ^3.6 |
| **Auth** | bcryptjs | ^2.4 |
| **Encryption** | Node.js crypto (AES-256-GCM) | Built-in |
| **Excel Export** | SheetJS (xlsx) | ^0.18 |
| **Environment** | dotenv | ^16.3 |
| **Frontend** | Vanilla HTML5 + CSS3 + JS | — |
| **Fonts** | Inter, Fraunces, IBM Plex Mono | Google Fonts |

---

## 🗄️ Database Schema

```
skyfinserv (MySQL Database)
│
├── admins                    → Admin users with bcrypt hashed passwords
├── applications              → Public loan applications (KYC + address + professional details)
│
├── borrowers                 → Borrower financial profiles (CIBIL, income, EMI, assets)
├── loan_applications_los     → Bank assignment loan applications linked to borrowers
├── bank_assignments          → Borrower ↔ bank product assignments with full status tracking
│
├── banks                     → Bank / NBFC master (name, code, type, logo, brand color)
├── bank_products             → Product matrix (bank × loan type × eligibility criteria)
├── product_categories        → Fresh / Balance Transfer / Top-Up / OD / CC
│
├── loan_types_master         → Loan type master (HL, BL, LAP, PL, GL etc.)
├── loan_type_subcategories   → Subcategories with full product parameters per type
│
└── audit_log                 → Immutable admin action log (timestamp, user, action, IP)
```

> **Auto-Setup**: All tables are created automatically on first `node server.js` run. No manual SQL required.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- MySQL 8.0 or higher (running locally or remote)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/sachinkhanande/SkyFinserv.git
cd SkyFinserv

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials (see Environment Variables below)

# 4. Start the server
# This automatically creates the database, all tables, and seeds default data
node server.js
```

### Expected Output
```
✅ Database "skyfinserv" ready — all tables OK
✅ Seeded default admin — username: admin | password: admin123
✅ Loan type subcategories seeded
🚀 SkyFinserv running at http://localhost:3000
   Admin login: username=admin  password=admin123
```

### Open in Browser
```
http://localhost:3000
```

### Default Admin Login
| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> ⚠️ Change the default password immediately after first login via **Admin → Change Password**

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=skyfinserv

# Server
PORT=3000

# Encryption Key (must be exactly 32 characters)
ENCRYPTION_KEY=skyfinserv_dev_key_32bytes_paddd!
```

> ⚠️ **Important**: Change `ENCRYPTION_KEY` to a unique random 32-character string in production. This key encrypts Aadhaar numbers stored in the database.

---

## 📁 Project Structure

```
skyfinserv/
│
├── server.js              # Express server, all API routes, auto DB setup & seeding
├── skyfinserv-app.html    # Complete frontend — Single Page Application (SPA)
├── package.json           # Node.js dependencies
├── package-lock.json      # Dependency lock file
├── .env                   # Environment configuration (not committed to git)
├── .env.example           # Environment template
├── schema.sql             # Reference SQL schema for documentation
└── README.md              # This file
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Admin login with username & password |
| POST | `/api/change-password` | Change admin password |

### Applications (Public Form)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications` | Submit new loan application |
| GET | `/api/applications` | List all applications |
| GET | `/api/applications/:id` | Get application details |
| PUT | `/api/applications/:id` | Update application |
| PATCH | `/api/applications/:id/status` | Update application status |
| DELETE | `/api/applications/:id` | Delete application |

### Bank Assignment (LOS)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/los/banks` | List all banks |
| POST | `/api/los/banks` | Add new bank |
| PUT | `/api/los/banks/:id` | Update bank |
| DELETE | `/api/los/banks/:id` | Deactivate bank |
| GET | `/api/los/bank-products` | List products (filter by loan type) |
| POST | `/api/los/bank-products` | Add bank product |
| PUT | `/api/los/bank-products/:id` | Update product |
| DELETE | `/api/los/bank-products/:id` | Deactivate product |
| GET | `/api/los/borrowers` | List borrowers |
| POST | `/api/los/borrowers` | Create borrower |
| PUT | `/api/los/borrowers/:id` | Update borrower |
| DELETE | `/api/los/borrowers/:id` | Delete borrower |
| GET | `/api/los/applications` | List LOS applications |
| POST | `/api/los/applications` | Create LOS application |
| GET | `/api/los/applications/:id` | Get application with assignments |
| POST | `/api/los/recommend` | Run bank recommendation engine |
| POST | `/api/los/assign` | Assign banks to application |
| PATCH | `/api/los/assignments/:id` | Update assignment status & details |
| DELETE | `/api/los/assignments/:id` | Remove bank assignment |
| POST | `/api/los/eligibility-check` | Check borrower eligibility for a product |
| GET | `/api/los/admin-search` | Search applications & borrowers |

### Loan Types
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/los/loan-types` | List all loan types |
| GET | `/api/los/loan-types-full` | Loan types with all subcategories |
| POST | `/api/los/loan-types` | Add loan type |
| PUT | `/api/los/loan-types/:id` | Update loan type |
| DELETE | `/api/los/loan-types/:id` | Deactivate loan type |
| GET | `/api/los/loan-types/:id/subcategories` | List subcategories |
| POST | `/api/los/subcategories` | Add subcategory |
| PUT | `/api/los/subcategories/:id` | Update subcategory |
| DELETE | `/api/los/subcategories/:id` | Delete subcategory |

### Audit Log
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit-log` | Fetch audit log entries |
| POST | `/api/audit-log` | Write audit entry |
| DELETE | `/api/audit-log/clear` | Clear all audit entries |
| DELETE | `/api/audit-log/:id` | Delete single audit entry |

---

## 🔒 Security

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcrypt with 12 salt rounds |
| Aadhaar Encryption | AES-256-GCM with random IV per record |
| Aadhaar Display | Masked as XXXX-XXXX-XXXX by default |
| Reveal Logging | Every Aadhaar reveal is audit-logged |
| Admin Actions | All actions logged with timestamp and IP |
| SQL Injection | Parameterized queries via mysql2 |

---

## 🗺️ Roadmap

- [ ] JWT-based session management
- [ ] Multi-user roles (RM, Branch Manager, Credit Team)
- [ ] SMS / Email notifications on status change
- [ ] PDF application form generation
- [ ] Document upload (KYC, income proof)
- [ ] Dashboard analytics with charts
- [ ] Mobile responsive design
- [ ] Multi-branch support

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — free to use, modify and distribute.

```
MIT License

Copyright (c) 2026 SkyFinserv

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👨‍💻 Built With ❤️ for Indian Loan Professionals

> SkyFinserv is purpose-built for the Indian lending ecosystem — supporting all major loan products offered by Indian banks and NBFCs, with INR currency formatting, Indian state selection, PAN/Aadhaar compliance, and CIBIL score-based eligibility checks.

---

<div align="center">
  <strong>SkyFinserv — Loan Origination Desk</strong><br/>
  <em>Simplifying loan origination for DSAs, consultants and financial intermediaries</em>
</div>
