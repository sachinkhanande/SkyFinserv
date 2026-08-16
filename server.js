/*
  SkyFinserv — Loan Application Intake Server
  Auto-creates the database and all tables on first run.
  Run: node server.js
*/

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ─── Encryption helpers (AES-256-GCM for Aadhaar) ───────────────────────────
const ENC_KEY = (process.env.ENCRYPTION_KEY || 'skyfinserv_dev_key_32bytes_paddd!').slice(0, 32);

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENC_KEY), iv);
  const enc = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + enc.toString('hex');
}

function decrypt(ciphertext) {
  if (!ciphertext || !ciphertext.includes(':')) return ciphertext || '';
  try {
    const [ivHex, tagHex, encHex] = ciphertext.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENC_KEY), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(encHex, 'hex')) + decipher.final('utf8');
  } catch {
    return ciphertext; // return as-is if not encrypted (legacy rows)
  }
}

// ─── DB pool (created after DB is guaranteed to exist) ───────────────────────
let pool;

// ─── Auto-setup: create DB + tables + seed admin ─────────────────────────────
async function setupDatabase() {
  const DB = process.env.DB_NAME || 'skyfinserv';
  try {
    // Step 1: connect WITHOUT specifying the database so we can create it
    const root = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      connectTimeout: 2000
    });

    await root.execute(
      `CREATE DATABASE IF NOT EXISTS \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await root.end();

    // Step 2: create pool pointed at our DB
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: DB,
      waitForConnections: true,
      connectionLimit: 10,
    });
  } catch (err) {
    console.warn(`\n⚠️ MySQL database connection bypassed (${err.code || err.message}).`);
    console.warn(`💡 Running in Standalone Local Storage Mode (Browser IndexedDB & LocalStorage active).\n`);
    pool = null;
    return;
  }

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      user_id        VARCHAR(50)  UNIQUE NOT NULL,
      password_hash  VARCHAR(255) NOT NULL,
      display_name   VARCHAR(100),
      application_no VARCHAR(50),
      is_permitted   TINYINT(1) DEFAULT 1,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS applications (
      id                   INT AUTO_INCREMENT PRIMARY KEY,
      app_no               VARCHAR(20) UNIQUE,
      status               VARCHAR(30)  DEFAULT 'Submitted',
      created_at           BIGINT,

      applicant_role        VARCHAR(30),
      applicant_type        VARCHAR(50),
      loan_products         TEXT,
      assigned_product      VARCHAR(150),

      first_name            VARCHAR(100),
      middle_name           VARCHAR(100),
      last_name             VARCHAR(100),
      gender                VARCHAR(20),
      marital_status        VARCHAR(30),
      education             VARCHAR(100),
      residency_status      VARCHAR(30)  DEFAULT 'Indian',
      dob                   VARCHAR(20),
      father_name           VARCHAR(150),
      mothers_maiden_name   VARCHAR(150),
      pan_number            VARCHAR(20),
      aadhaar               VARCHAR(255),

      curr_address          TEXT,
      curr_city             VARCHAR(100),
      curr_state            VARCHAR(100),
      curr_pincode          VARCHAR(20),
      curr_occupancy        VARCHAR(50),
      curr_vintage          VARCHAR(50),
      curr_contact          VARCHAR(30),

      perm_address          TEXT,
      perm_city             VARCHAR(100),
      perm_state            VARCHAR(100),
      perm_pincode          VARCHAR(20),
      perm_occupancy        VARCHAR(50),
      perm_vintage          VARCHAR(50),
      perm_distance         VARCHAR(50),
      perm_email            VARCHAR(150),
      perm_contact          VARCHAR(30),

      employer_name         VARCHAR(150),
      office_address        TEXT,
      designation           VARCHAR(100),
      emp_vintage           VARCHAR(50),
      emp_distance          VARCHAR(50),
      emp_email             VARCHAR(150),
      emp_contact           VARCHAR(30),

      business_name         VARCHAR(150),
      business_type         VARCHAR(100),
      business_address      TEXT,
      business_vintage      VARCHAR(50),
      gst_number            VARCHAR(20),
      business_contact      VARCHAR(30),

      /* Master Form Additions */
      branch                 VARCHAR(100),
      rm_name                VARCHAR(150),
      loan_purpose           VARCHAR(200),
      requested_amount       DECIMAL(15,2),
      tenure_months          INT,
      passport_no            VARCHAR(50),
      voter_id               VARCHAR(50),
      driving_licence        VARCHAR(50),
      has_coborrower         TINYINT(1) DEFAULT 0,
      coborrower_json        LONGTEXT,
      industry               VARCHAR(150),
      experience_years       VARCHAR(50),
      annual_income          DECIMAL(15,2),
      gross_income           DECIMAL(15,2),
      net_income             DECIMAL(15,2),
      other_income           DECIMAL(15,2),
      rental_income          DECIMAL(15,2),
      agri_income            DECIMAL(15,2),
      existing_emi           DECIMAL(15,2),
      monthly_obligations    DECIMAL(15,2),
      bank_accounts_json     LONGTEXT,
      existing_loans_json    LONGTEXT,
      property_details_json  LONGTEXT,
      business_details_json  LONGTEXT,
      references_json        LONGTEXT,
      documents_checklist_json LONGTEXT
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS loan_tracking (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      application_id    INT UNIQUE,
      month             VARCHAR(20),
      entity            VARCHAR(150),
      connector         VARCHAR(150),
      applicant         VARCHAR(150),
      business_employer VARCHAR(150),
      category          VARCHAR(50),
      mobile_no         VARCHAR(20),
      email_id          VARCHAR(150),
      bank_nbfc         VARCHAR(150),
      sm_name           VARCHAR(150),
      product           VARCHAR(150),
      fresh_bt_topup    VARCHAR(50),
      credit_program    VARCHAR(150),
      login_date        VARCHAR(20),
      applied_amount    DECIMAL(15,2),
      decision_date     VARCHAR(20),
      decision          VARCHAR(50),
      sanctioned_amount DECIMAL(15,2),
      disb_date         VARCHAR(20),
      disb_amount       DECIMAL(15,2),
      ll                DECIMAL(15,2),
      gx                DECIMAL(15,2),
      pf                DECIMAL(15,2),
      roi               DECIMAL(8,4),
      emi               DECIMAL(15,2),
      tenure            INT,
      dd_rtgs_amount    DECIMAL(15,2),
      dd_rtgs_date      VARCHAR(20),
      deviation         TEXT,
      app_id            VARCHAR(100),
      noi               DECIMAL(15,2),
      remark            TEXT,
      updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS dm_records (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      month           VARCHAR(50),
      entity          VARCHAR(150),
      connector       VARCHAR(150),
      applicant       VARCHAR(150),
      employer        VARCHAR(150),
      category        VARCHAR(100),
      bank            VARCHAR(150),
      rm_name         VARCHAR(150),
      product         VARCHAR(150),
      program         VARCHAR(150),
      credit_program  VARCHAR(150),
      login_date      VARCHAR(20),
      applied_amount  VARCHAR(50),
      decision_date   VARCHAR(20),
      decision        VARCHAR(100),
      sanction_amount VARCHAR(50),
      disb_date       VARCHAR(20),
      disb_amount     VARCHAR(50),
      li              VARCHAR(50),
      gi              VARCHAR(50),
      pf              VARCHAR(50),
      roi             VARCHAR(50),
      emi             VARCHAR(50),
      tenure          VARCHAR(50),
      pdc_amount      VARCHAR(50),
      pdc_date        VARCHAR(20),
      queries         TEXT,
      app_id          VARCHAR(100),
      noi_date        VARCHAR(20),
      remark          TEXT,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      admin_user VARCHAR(100),
      action     VARCHAR(100),
      detail     TEXT,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS financial_datasheets (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      title          VARCHAR(255),
      application_id VARCHAR(100),
      datasheet_json LONGTEXT,
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  if (!pool) return;

  // Step 4: seed default SuperAdmin
  const [rows] = await pool.execute('SELECT COUNT(*) AS cnt FROM admins');
  if (rows[0].cnt === 0) {
    const hash = await bcrypt.hash('admin123', 12);
    await pool.execute(
      'INSERT INTO admins (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)',
      ['admin', hash, 'Super Admin', 'SuperAdmin']
    );
    console.log('✅ Seeded default admin — username: admin | password: admin123');
  } else {
    // Always ensure admin password is correct
    const [admins] = await pool.execute('SELECT * FROM admins WHERE username = ?', ['admin']);
    if (admins.length === 0) {
      const hash = await bcrypt.hash('admin123', 12);
      await pool.execute(
        'INSERT INTO admins (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)',
        ['admin', hash, 'Super Admin', 'SuperAdmin']
      );
      console.log('✅ Created admin — username: admin | password: admin123');
    }
  }

  // Seed default permitted User ID
  const [uCountRows] = await pool.execute('SELECT COUNT(*) AS cnt FROM users');
  if (uCountRows[0].cnt === 0) {
    const uHash = await bcrypt.hash('user123', 12);
    await pool.execute(
      'INSERT INTO users (user_id, password_hash, display_name, is_permitted) VALUES (?, ?, ?, ?)',
      ['USER001', uHash, 'Demo Applicant (Permitted)', 1]
    );
    console.log('✅ Seeded default permitted user — user_id: USER001 | password: user123');
  }



  const masterMigrations = [
    `ALTER TABLE applications ADD COLUMN residency_status VARCHAR(30) DEFAULT 'Indian'`,
    `ALTER TABLE applications ADD COLUMN branch VARCHAR(100)`,
    `ALTER TABLE applications ADD COLUMN rm_name VARCHAR(150)`,
    `ALTER TABLE applications ADD COLUMN loan_purpose VARCHAR(200)`,
    `ALTER TABLE applications ADD COLUMN requested_amount DECIMAL(15,2)`,
    `ALTER TABLE applications ADD COLUMN tenure_months INT`,
    `ALTER TABLE applications ADD COLUMN passport_no VARCHAR(50)`,
    `ALTER TABLE applications ADD COLUMN voter_id VARCHAR(50)`,
    `ALTER TABLE applications ADD COLUMN driving_licence VARCHAR(50)`,
    `ALTER TABLE applications ADD COLUMN has_coborrower TINYINT(1) DEFAULT 0`,
    `ALTER TABLE applications ADD COLUMN coborrower_json LONGTEXT`,
    `ALTER TABLE applications ADD COLUMN industry VARCHAR(150)`,
    `ALTER TABLE applications ADD COLUMN experience_years VARCHAR(50)`,
    `ALTER TABLE applications ADD COLUMN annual_income DECIMAL(15,2)`,
    `ALTER TABLE applications ADD COLUMN gross_income DECIMAL(15,2)`,
    `ALTER TABLE applications ADD COLUMN net_income DECIMAL(15,2)`,
    `ALTER TABLE applications ADD COLUMN other_income DECIMAL(15,2)`,
    `ALTER TABLE applications ADD COLUMN rental_income DECIMAL(15,2)`,
    `ALTER TABLE applications ADD COLUMN agri_income DECIMAL(15,2)`,
    `ALTER TABLE applications ADD COLUMN existing_emi DECIMAL(15,2)`,
    `ALTER TABLE applications ADD COLUMN monthly_obligations DECIMAL(15,2)`,
    `ALTER TABLE applications ADD COLUMN bank_accounts_json LONGTEXT`,
    `ALTER TABLE applications ADD COLUMN existing_loans_json LONGTEXT`,
    `ALTER TABLE applications ADD COLUMN property_details_json LONGTEXT`,
    `ALTER TABLE applications ADD COLUMN business_details_json LONGTEXT`,
    `ALTER TABLE applications ADD COLUMN references_json LONGTEXT`,
    `ALTER TABLE applications ADD COLUMN documents_checklist_json LONGTEXT`,
    `ALTER TABLE applications ADD COLUMN connector VARCHAR(150)`,
  ];

  for (const sql of masterMigrations) {
    try { await pool.execute(sql); }
    catch (e) { if (e.errno !== 1060) console.warn('Migration warning:', e.message); }
  }

  console.log(`✅ Database "${DB}" ready — all tables OK`);
}

// ─── App number generator ─────────────────────────────────────────────────────
async function generateAppNo() {
  const [rows] = await pool.execute('SELECT COUNT(*) AS cnt FROM applications');
  const n = rows[0].cnt + 1;
  return 'SKF' + String(n).padStart(7, '0');
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));   // serves skyfinserv-app.html

// ─── Helper: write audit log ──────────────────────────────────────────────────
async function writeAudit(action, detail, ip, adminUser) {
  try {
    await pool.execute(
      'INSERT INTO audit_log (admin_user, action, detail, ip_address) VALUES (?, ?, ?, ?)',
      [adminUser || 'system', action, detail || '', ip || '']
    );
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

// ─── Row → JS object mapper ───────────────────────────────────────────────────
function rowToApp(r) {
  return {
    id: String(r.id),
    appNo: r.app_no,
    status: r.status,
    createdAt: Number(r.created_at),
    applicantRole: r.applicant_role,
    applicantType: r.applicant_type,
    loanProducts: r.loan_products ? JSON.parse(r.loan_products) : [],
    assignedProduct: r.assigned_product,
    firstName: r.first_name,
    middleName: r.middle_name,
    lastName: r.last_name,
    gender: r.gender,
    maritalStatus: r.marital_status,
    education: r.education,
    residencyStatus: r.residency_status || 'Indian',
    dob: r.dob,
    fatherName: r.father_name,
    mothersMaidenName: r.mothers_maiden_name,
    panNumber: r.pan_number,
    aadhaar: decrypt(r.aadhaar),
    currAddress: r.curr_address,
    currCity: r.curr_city,
    currState: r.curr_state,
    currPincode: r.curr_pincode,
    currOccupancy: r.curr_occupancy,
    currVintage: r.curr_vintage,
    currContact: r.curr_contact,
    permAddress: r.perm_address,
    permCity: r.perm_city,
    permState: r.perm_state,
    permPincode: r.perm_pincode,
    permOccupancy: r.perm_occupancy,
    permVintage: r.perm_vintage,
    permDistance: r.perm_distance,
    permEmail: r.perm_email,
    permContact: r.perm_contact,
    employerName: r.employer_name,
    officeAddress: r.office_address,
    designation: r.designation,
    empVintage: r.emp_vintage,
    empDistance: r.emp_distance,
    empEmail: r.emp_email,
    empContact: r.emp_contact,
    businessName: r.business_name,
    businessType: r.business_type,
    businessAddress: r.business_address,
    businessVintage: r.business_vintage,
    gstNumber: r.gst_number,
    businessContact: r.business_contact,

    /* Master Form mapped fields */
    branch: r.branch || '',
    rmName: r.rm_name || '',
    loanPurpose: r.loan_purpose || '',
    requestedAmount: r.requested_amount !== null ? Number(r.requested_amount) : null,
    tenureMonths: r.tenure_months !== null ? Number(r.tenure_months) : null,
    passportNo: r.passport_no || '',
    voterId: r.voter_id || '',
    drivingLicence: r.driving_licence || '',
    hasCoborrower: Boolean(r.has_coborrower),
    coborrower: r.coborrower_json ? JSON.parse(r.coborrower_json) : null,
    industry: r.industry || '',
    experienceYears: r.experience_years || '',
    annualIncome: r.annual_income !== null ? Number(r.annual_income) : null,
    grossIncome: r.gross_income !== null ? Number(r.gross_income) : null,
    netIncome: r.net_income !== null ? Number(r.net_income) : null,
    otherIncome: r.other_income !== null ? Number(r.other_income) : null,
    rentalIncome: r.rental_income !== null ? Number(r.rental_income) : null,
    agriIncome: r.agri_income !== null ? Number(r.agri_income) : null,
    existingEmi: r.existing_emi !== null ? Number(r.existing_emi) : null,
    monthlyObligations: r.monthly_obligations !== null ? Number(r.monthly_obligations) : null,
    bankAccounts: r.bank_accounts_json ? JSON.parse(r.bank_accounts_json) : [],
    existingLoans: r.existing_loans_json ? JSON.parse(r.existing_loans_json) : [],
    propertyDetails: r.property_details_json ? JSON.parse(r.property_details_json) : null,
    businessDetails: r.business_details_json ? JSON.parse(r.business_details_json) : null,
    references: r.references_json ? JSON.parse(r.references_json) : [],
    documentsChecklist: r.documents_checklist_json ? JSON.parse(r.documents_checklist_json) : {},

    tracking: null, // loaded separately
  };
}

// ═══════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════

// POST /api/applications — submit a new loan application
app.post('/api/applications', async (req, res) => {
  try {
    const d = req.body;
    const appNo = (d.appNo && String(d.appNo).trim()) ? String(d.appNo).trim() : await generateAppNo();
    const now = Date.now();
    const aadhaarEncrypted = encrypt(d.aadhaar || '');

    await pool.execute(
      `INSERT INTO applications (
        app_no, status, created_at,
        applicant_role, applicant_type, loan_products, assigned_product,
        first_name, middle_name, last_name, gender, marital_status,
        education, residency_status, dob, father_name, mothers_maiden_name, pan_number, aadhaar,
        curr_address, curr_city, curr_state, curr_pincode, curr_occupancy, curr_vintage, curr_contact,
        perm_address, perm_city, perm_state, perm_pincode, perm_occupancy, perm_vintage,
        perm_distance, perm_email, perm_contact,
        employer_name, office_address, designation, emp_vintage, emp_distance, emp_email, emp_contact,
        business_name, business_type, business_address, business_vintage, gst_number, business_contact,
        branch, rm_name, loan_purpose, requested_amount, tenure_months,
        passport_no, voter_id, driving_licence, has_coborrower, coborrower_json,
        industry, experience_years, annual_income, gross_income, net_income,
        other_income, rental_income, agri_income, existing_emi, monthly_obligations,
        bank_accounts_json, existing_loans_json, property_details_json, business_details_json,
        references_json, documents_checklist_json
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        appNo,
        d.status || 'Submitted',
        now,
        d.applicantRole || '',
        d.applicantType || '',
        JSON.stringify(d.loanProducts || []),
        d.assignedProduct || '',
        d.firstName || '',
        d.middleName || '',
        d.lastName || '',
        d.gender || '',
        d.maritalStatus || '',
        d.education || '',
        d.residencyStatus || 'Indian',
        d.dob || '',
        d.fatherName || '',
        d.mothersMaidenName || '',
        (d.panNumber || '').toUpperCase(),
        aadhaarEncrypted,
        d.currAddress || '',
        d.currCity || '',
        d.currState || '',
        d.currPincode || '',
        d.currOccupancy || '',
        d.currVintage || '',
        d.currContact || '',
        d.permAddress || '',
        d.permCity || '',
        d.permState || '',
        d.permPincode || '',
        d.permOccupancy || '',
        d.permVintage || '',
        d.permDistance || '',
        d.permEmail || '',
        d.permContact || '',
        d.employerName || '',
        d.officeAddress || '',
        d.designation || '',
        d.empVintage || '',
        d.empDistance || '',
        d.empEmail || '',
        d.empContact || '',
        d.businessName || '',
        d.businessType || '',
        d.businessAddress || '',
        d.businessVintage || '',
        d.gstNumber || '',
        d.businessContact || '',
        d.branch || '',
        d.rmName || '',
        d.loanPurpose || '',
        d.requestedAmount || null,
        d.tenureMonths || null,
        d.passportNo || '',
        d.voterId || '',
        d.drivingLicence || '',
        d.hasCoborrower ? 1 : 0,
        d.coborrower ? JSON.stringify(d.coborrower) : null,
        d.industry || '',
        d.experienceYears || '',
        d.annualIncome || null,
        d.grossIncome || null,
        d.netIncome || null,
        d.otherIncome || null,
        d.rentalIncome || null,
        d.agriIncome || null,
        d.existingEmi || null,
        d.monthlyObligations || null,
        d.bankAccounts ? JSON.stringify(d.bankAccounts) : null,
        d.existingLoans ? JSON.stringify(d.existingLoans) : null,
        d.propertyDetails ? JSON.stringify(d.propertyDetails) : null,
        d.businessDetails ? JSON.stringify(d.businessDetails) : null,
        d.references ? JSON.stringify(d.references) : null,
        d.documentsChecklist ? JSON.stringify(d.documentsChecklist) : null,
      ]
    );

    const [inserted] = await pool.execute('SELECT * FROM applications WHERE app_no = ?', [appNo]);
    const appRow = inserted[0];

    // Auto-create corresponding mapped dm_records row
    try {
      const payload = appRowToDmPayload(appRow, {});
      await pool.execute(
        `INSERT INTO dm_records (
          month, entity, connector, applicant, employer, category,
          bank, rm_name, product, program, credit_program, login_date,
          applied_amount, decision_date, decision, sanction_amount,
          disb_date, disb_amount, li, gi, pf, roi, emi, tenure,
          pdc_amount, pdc_date, queries, app_id, noi_date, remark
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          payload.month, payload.entity, payload.connector, payload.applicant, payload.employer, payload.category,
          payload.bank, payload.rmName, payload.product, payload.program, payload.creditProgram, payload.loginDate,
          payload.appliedAmount, payload.decisionDate, payload.decision, payload.sanctionAmount,
          payload.disbDate, payload.disbAmount, payload.li, payload.gi, payload.pf, payload.roi, payload.emi, payload.tenure,
          payload.pdcAmount, payload.pdcDate, payload.queries, payload.appId, payload.noiDate, payload.remark
        ]
      );
    } catch (dmErr) {
      console.warn('Auto-sync dm_records warn:', dmErr.message);
    }

    res.status(201).json(rowToApp(appRow));
  } catch (e) {
    console.error('POST /api/applications error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN AUTH ROUTES
// ═══════════════════════════════════════════════════════════

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { loginType, userId, username, password, securityPin } = req.body;
  const identifier = String(userId || username || '').trim();

  if (!identifier || !password) {
    return res.status(400).json({ error: 'User ID and password are required.' });
  }

  const mode = loginType === 'admin' ? 'Admin' : 'User';

  try {
    if (!pool) {
      // Standalone / Offline Mode (MySQL bypassed)
      if (password.length >= 6) {
        return res.json({
          ok: true,
          loginType: mode.toLowerCase(),
          userId: identifier,
          username: identifier,
          displayName: mode + ' ' + identifier.toUpperCase(),
          role: mode === 'Admin' ? 'SuperAdmin' : 'StandardUser',
          token: 'standalone-token-' + Date.now()
        });
      }
      return res.status(401).json({ error: 'Invalid credentials. Password must be at least 6 characters.' });
    }

    if (mode === 'Admin') {
      const [rows] = await pool.execute('SELECT * FROM admins WHERE username = ?', [identifier]);
      if (rows.length > 0) {
        const admin = rows[0];
        const ok = await bcrypt.compare(password, admin.password_hash);
        if (!ok) {
          await writeAudit('ADMIN_LOGIN_FAILED', `Failed admin login attempt for ${identifier}`, req.ip, identifier);
          return res.status(401).json({ error: 'Invalid Admin ID or Password.' });
        }
        await writeAudit('ADMIN_LOGIN_SUCCESS', `Admin logged in successfully: ${identifier}`, req.ip, identifier);
        return res.json({
          ok: true,
          loginType: 'admin',
          userId: admin.username,
          username: admin.username,
          displayName: admin.display_name || 'System Admin',
          role: admin.role || 'SuperAdmin',
          token: 'admin-token-' + Date.now()
        });
      }
      return res.status(401).json({ error: 'Invalid Admin Username or Password.' });
    }

    // User authentication with Admin permission checks
    const [uRows] = await pool.execute('SELECT * FROM users WHERE user_id = ?', [identifier]);
    if (uRows.length > 0) {
      const uAcc = uRows[0];
      if (uAcc.is_permitted === 0) {
        await writeAudit('USER_LOGIN_BLOCKED', `Blocked unpermitted user login attempt: ${identifier}`, req.ip, identifier);
        return res.status(403).json({ error: 'Access Denied: Your User ID is pending Admin approval. Please contact Administrator.' });
      }
      const ok = await bcrypt.compare(password, uAcc.password_hash);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid User ID or Password.' });
      }
      await writeAudit('USER_LOGIN_SUCCESS', `User logged in successfully: ${identifier}`, req.ip, identifier);
      return res.json({
        ok: true,
        loginType: 'user',
        userId: uAcc.user_id,
        username: uAcc.user_id,
        displayName: uAcc.display_name || uAcc.user_id,
        role: 'StandardUser',
        token: 'user-token-' + Date.now()
      });
    }

    // Check if application exists (e.g. SKF0001001)
    const [appRows] = await pool.execute('SELECT * FROM applications WHERE app_no = ?', [identifier]);
    if (appRows.length > 0) {
      const aRow = appRows[0];
      if (aRow.status === 'Rejected') {
        return res.status(403).json({ error: 'Application is Rejected. Login is not permitted by Admin.' });
      }
      if (password.length >= 6) {
        const dName = [aRow.first_name, aRow.last_name].filter(Boolean).join(' ') || identifier;
        return res.json({
          ok: true,
          loginType: 'user',
          userId: identifier,
          username: identifier,
          displayName: dName,
          role: 'StandardUser',
          token: 'user-token-' + Date.now()
        });
      }
      return res.status(401).json({ error: 'Invalid password. Must be at least 6 characters.' });
    }

    return res.status(401).json({ error: 'User ID is not permitted or not created by Admin. Please contact Administrator.' });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error occurred during login.' });
  }
});

// GET /api/users — list permitted users
app.get('/api/users', async (req, res) => {
  try {
    if (!pool) return res.json([{ id: 1, user_id: 'USER001', display_name: 'Demo Applicant', is_permitted: 1 }]);
    const [rows] = await pool.execute('SELECT id, user_id, display_name, application_no, is_permitted, created_at FROM users ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/users — create / register a new User ID (requires Admin approval by default)
app.post('/api/users', async (req, res) => {
  try {
    const { userId, password, displayName, applicationNo, isPermitted } = req.body;
    if (!userId || !password) return res.status(400).json({ error: 'User ID and Password are required.' });

    const permitStatus = isPermitted !== undefined ? (isPermitted ? 1 : 0) : 0; // Default 0 = Pending Approval

    if (!pool) {
      return res.status(201).json({ ok: true, user_id: userId, display_name: displayName || userId, is_permitted: permitStatus });
    }

    const hash = await bcrypt.hash(password, 12);
    await pool.execute(
      'INSERT INTO users (user_id, password_hash, display_name, application_no, is_permitted) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
      [userId.trim(), hash, displayName || userId, applicationNo || '', permitStatus]
    );
    await writeAudit('USER_REGISTERED', `User registered User ID: ${userId} (Permitted: ${permitStatus})`, req.ip, userId);
    res.status(201).json({ ok: true, userId, displayName, isPermitted: permitStatus });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/users/:id/permit — Admin approves/revokes user access
app.patch('/api/users/:id/permit', async (req, res) => {
  try {
    const { isPermitted } = req.body;
    const permittedVal = isPermitted ? 1 : 0;
    if (!pool) return res.json({ ok: true, is_permitted: permittedVal });
    await pool.execute('UPDATE users SET is_permitted = ? WHERE id = ?', [permittedVal, req.params.id]);
    await writeAudit('USER_PERMISSION_CHANGED', `User ID #${req.params.id} permission updated to ${permittedVal}`, req.ip, 'admin');
    res.json({ ok: true, is_permitted: permittedVal });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admins — create a new Admin account
app.post('/api/admins', async (req, res) => {
  try {
    const { username, password, displayName, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and Password are required.' });

    if (!pool) {
      return res.status(201).json({ ok: true, username, displayName });
    }

    const hash = await bcrypt.hash(password, 12);
    await pool.execute(
      'INSERT INTO admins (username, password_hash, display_name, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
      [username.trim(), hash, displayName || username, role || 'Admin']
    );
    await writeAudit('ADMIN_CREATED', `Created Admin account: ${username}`, req.ip, 'admin');
    res.status(201).json({ ok: true, username, displayName });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper to convert database row to DM record JSON object
function rowToDmRecord(r) {
  if (!r) return null;
  return {
    id: r.id,
    month: r.month || '',
    entity: r.entity || '',
    connector: r.connector || '',
    applicant: r.applicant || '',
    employer: r.employer || '',
    category: r.category || '',
    bank: r.bank || '',
    rmName: r.rm_name || '',
    product: r.product || '',
    program: r.program || '',
    creditProgram: r.credit_program || '',
    loginDate: r.login_date || '',
    appliedAmount: r.applied_amount || '',
    decisionDate: r.decision_date || '',
    decision: r.decision || '',
    sanctionAmount: r.sanction_amount || '',
    disbDate: r.disb_date || '',
    disbAmount: r.disb_amount || '',
    li: r.li || '',
    gi: r.gi || '',
    pf: r.pf || '',
    roi: r.roi || '',
    emi: r.emi || '',
    tenure: r.tenure || '',
    pdcAmount: r.pdc_amount || '',
    pdcDate: r.pdc_date || '',
    queries: r.queries || '',
    appId: r.app_id || '',
    noiDate: r.noi_date || '',
    remark: r.remark || '',
    createdAt: r.created_at || null,
    updatedAt: r.updated_at || null,
  };
}

function appRowToDmPayload(app, tr = {}) {
  const createdDate = app.created_at ? new Date(Number(app.created_at)) : new Date();
  const monthStr = createdDate.toLocaleString('en-US', { month: 'short' }) + '-' + String(createdDate.getFullYear()).slice(-2);
  const formattedDate = createdDate.toISOString().split('T')[0];

  const fullName = [app.first_name, app.middle_name, app.last_name].filter(Boolean).join(' ').trim();
  const employer = app.employer_name || app.business_name || '';

  let primaryBank = '';
  if (app.bank_accounts_json) {
    try {
      const banks = typeof app.bank_accounts_json === 'string' ? JSON.parse(app.bank_accounts_json) : app.bank_accounts_json;
      if (Array.isArray(banks) && banks[0] && banks[0].bankName) primaryBank = banks[0].bankName;
    } catch (e) { }
  }

  let decision = 'LOGIN';
  if (app.status === 'Approved') decision = 'SANCTION';
  else if (app.status === 'Closed') decision = 'DISBURSED';
  else if (app.status === 'Rejected') decision = 'REJECTED';
  if (tr.decision) decision = tr.decision;

  return {
    month: tr.month || monthStr,
    entity: tr.entity || app.branch || 'SkyFinserv',
    connector: tr.connector || app.connector || '',
    applicant: fullName || 'Applicant',
    employer: tr.business_employer || employer,
    category: tr.category || app.applicant_type || 'Salaried',
    bank: tr.bank_nbfc || primaryBank || 'TBD',
    rmName: tr.sm_name || app.rm_name || '',
    product: tr.product || app.assigned_product || app.loan_products || '',
    program: tr.fresh_bt_topup || 'FRESH',
    creditProgram: tr.credit_program || app.loan_purpose || 'INCOME',
    loginDate: tr.login_date || formattedDate,
    appliedAmount: tr.applied_amount || app.requested_amount || '',
    decisionDate: tr.decision_date || formattedDate,
    decision: decision,
    sanctionAmount: tr.sanctioned_amount || app.requested_amount || '',
    disbDate: tr.disb_date || '',
    disbAmount: tr.disb_amount || '',
    li: tr.ll || '',
    gi: tr.gx || '',
    pf: tr.pf || '',
    roi: tr.roi || '',
    emi: tr.emi || '',
    tenure: tr.tenure || app.tenure_months || '',
    pdcAmount: tr.dd_rtgs_amount || '',
    pdcDate: tr.dd_rtgs_date || '',
    queries: tr.deviation || '',
    appId: app.app_no || '',
    noiDate: tr.noi || '',
    remark: tr.remark || '',
  };
}

// POST /api/dm-records/sync — Bulk Sync applications to dm_records
app.post('/api/dm-records/sync', async (req, res) => {
  try {
    const [apps] = await pool.execute('SELECT * FROM applications ORDER BY id DESC');
    const [existingDm] = await pool.execute('SELECT app_id FROM dm_records WHERE app_id IS NOT NULL AND app_id != ""');
    const existingAppIds = new Set(existingDm.map(r => r.app_id));
    const [allTracking] = await pool.execute('SELECT * FROM loan_tracking');
    const trackingByAppId = new Map(allTracking.map(t => [String(t.application_id), t]));

    let createdCount = 0;
    for (const appRow of apps) {
      if (appRow.app_no && existingAppIds.has(appRow.app_no)) continue;

      const tr = trackingByAppId.get(String(appRow.id)) || {};
      const payload = appRowToDmPayload(appRow, tr);

      await pool.execute(
        `INSERT INTO dm_records (
          month, entity, connector, applicant, employer, category,
          bank, rm_name, product, program, credit_program, login_date,
          applied_amount, decision_date, decision, sanction_amount,
          disb_date, disb_amount, li, gi, pf, roi, emi, tenure,
          pdc_amount, pdc_date, queries, app_id, noi_date, remark
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          payload.month, payload.entity, payload.connector, payload.applicant, payload.employer, payload.category,
          payload.bank, payload.rmName, payload.product, payload.program, payload.creditProgram, payload.loginDate,
          payload.appliedAmount, payload.decisionDate, payload.decision, payload.sanctionAmount,
          payload.disbDate, payload.disbAmount, payload.li, payload.gi, payload.pf, payload.roi, payload.emi, payload.tenure,
          payload.pdcAmount, payload.pdcDate, payload.queries, payload.appId, payload.noiDate, payload.remark
        ]
      );
      createdCount++;
    }

    const [allRows] = await pool.execute('SELECT * FROM dm_records ORDER BY created_at DESC');
    res.json({ synced: createdCount, records: allRows.map(rowToDmRecord) });
  } catch (e) {
    console.error('POST /api/dm-records/sync error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/dm-records
app.get('/api/dm-records', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM dm_records ORDER BY created_at DESC');
    res.json(rows.map(rowToDmRecord));
  } catch (e) {
    console.error('GET /api/dm-records error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/dm-records
app.post('/api/dm-records', async (req, res) => {
  try {
    const d = req.body;
    const [result] = await pool.execute(
      `INSERT INTO dm_records (
        month, entity, connector, applicant, employer, category,
        bank, rm_name, product, program, credit_program, login_date,
        applied_amount, decision_date, decision, sanction_amount,
        disb_date, disb_amount, li, gi, pf, roi, emi, tenure,
        pdc_amount, pdc_date, queries, app_id, noi_date, remark
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        d.month || '', d.entity || '', d.connector || '', d.applicant || '', d.employer || '', d.category || '',
        d.bank || '', d.rmName || '', d.product || '', d.program || '', d.creditProgram || '', d.loginDate || '',
        d.appliedAmount || '', d.decisionDate || '', d.decision || '', d.sanctionAmount || '',
        d.disbDate || '', d.disbAmount || '', d.li || '', d.gi || '', d.pf || '', d.roi || '', d.emi || '', d.tenure || '',
        d.pdcAmount || '', d.pdcDate || '', d.queries || '', d.appId || '', d.noiDate || '', d.remark || ''
      ]
    );
    const [rows] = await pool.execute('SELECT * FROM dm_records WHERE id = ?', [result.insertId]);
    res.status(201).json(rowToDmRecord(rows[0]));
  } catch (e) {
    console.error('POST /api/dm-records error:', e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/dm-records/:id
app.put('/api/dm-records/:id', async (req, res) => {
  try {
    const d = req.body;
    await pool.execute(
      `UPDATE dm_records SET
        month = ?, entity = ?, connector = ?, applicant = ?, employer = ?, category = ?,
        bank = ?, rm_name = ?, product = ?, program = ?, credit_program = ?, login_date = ?,
        applied_amount = ?, decision_date = ?, decision = ?, sanction_amount = ?,
        disb_date = ?, disb_amount = ?, li = ?, gi = ?, pf = ?, roi = ?, emi = ?, tenure = ?,
        pdc_amount = ?, pdc_date = ?, queries = ?, app_id = ?, noi_date = ?, remark = ?
       WHERE id = ?`,
      [
        d.month || '', d.entity || '', d.connector || '', d.applicant || '', d.employer || '', d.category || '',
        d.bank || '', d.rmName || '', d.product || '', d.program || '', d.creditProgram || '', d.loginDate || '',
        d.appliedAmount || '', d.decisionDate || '', d.decision || '', d.sanctionAmount || '',
        d.disbDate || '', d.disbAmount || '', d.li || '', d.gi || '', d.pf || '', d.roi || '', d.emi || '', d.tenure || '',
        d.pdcAmount || '', d.pdcDate || '', d.queries || '', d.appId || '', d.noiDate || '', d.remark || '',
        req.params.id
      ]
    );
    const [rows] = await pool.execute('SELECT * FROM dm_records WHERE id = ?', [req.params.id]);
    res.json(rowToDmRecord(rows[0]));
  } catch (e) {
    console.error('PUT /api/dm-records/:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/dm-records/:id
app.delete('/api/dm-records/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM dm_records WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (e) {
    console.error('DELETE /api/dm-records/:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ─── Financial Datasheets (CAM & Income Assessment Matrix) Endpoints ─────────
app.get('/api/financial-datasheets', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM financial_datasheets ORDER BY updated_at DESC');
    const result = rows.map(r => ({
      id: r.id,
      title: r.title,
      applicationId: r.application_id,
      datasheet: r.datasheet_json ? JSON.parse(r.datasheet_json) : null,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    res.json(result);
  } catch (e) {
    console.error('GET /api/financial-datasheets error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/financial-datasheets', async (req, res) => {
  try {
    const { title, applicationId, datasheet } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO financial_datasheets (title, application_id, datasheet_json) VALUES (?, ?, ?)',
      [title || 'Financial Datasheet', applicationId || '', JSON.stringify(datasheet || {})]
    );
    const [rows] = await pool.execute('SELECT * FROM financial_datasheets WHERE id = ?', [result.insertId]);
    const r = rows[0];
    res.status(201).json({
      id: r.id,
      title: r.title,
      applicationId: r.application_id,
      datasheet: JSON.parse(r.datasheet_json),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    });
  } catch (e) {
    console.error('POST /api/financial-datasheets error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/financial-datasheets/:id', async (req, res) => {
  try {
    const { title, applicationId, datasheet } = req.body;
    await pool.execute(
      'UPDATE financial_datasheets SET title = ?, application_id = ?, datasheet_json = ? WHERE id = ?',
      [title || 'Financial Datasheet', applicationId || '', JSON.stringify(datasheet || {}), req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM financial_datasheets WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const r = rows[0];
    res.json({
      id: r.id,
      title: r.title,
      applicationId: r.application_id,
      datasheet: JSON.parse(r.datasheet_json),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    });
  } catch (e) {
    console.error('PUT /api/financial-datasheets/:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/financial-datasheets/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM financial_datasheets WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (e) {
    console.error('DELETE /api/financial-datasheets/:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/change-password
app.post('/api/change-password', async (req, res) => {
  const { username, currentPassword, newPassword, newUsername } = req.body;
  const trimmedUsername = typeof username === 'string' ? username.trim() : '';
  const finalUsername = typeof newUsername === 'string' && newUsername.trim() ? newUsername.trim() : trimmedUsername;
  if (!trimmedUsername || !currentPassword || !newPassword)
    return res.status(400).json({ error: 'Current username, current password and new password are required.' });
  try {
    const [rows] = await pool.execute('SELECT * FROM admins WHERE username = ?', [trimmedUsername]);
    if (!rows.length) return res.status(404).json({ error: 'Admin not found.' });
    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });
    if (finalUsername !== trimmedUsername) {
      const [exists] = await pool.execute('SELECT 1 FROM admins WHERE username = ? LIMIT 1', [finalUsername]);
      if (exists.length) return res.status(409).json({ error: 'That username is already taken.' });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.execute(
      'UPDATE admins SET username = ?, password_hash = ? WHERE username = ?',
      [finalUsername, hash, trimmedUsername]
    );
    await writeAudit(
      'CHANGE_PASSWORD',
      `Password updated${finalUsername !== trimmedUsername ? ` and username changed to ${finalUsername}` : ''}`,
      req.ip,
      trimmedUsername
    );
    res.json({ username: finalUsername, displayName: rows[0].display_name, role: rows[0].role });
  } catch (e) {
    console.error('Change password error:', e);
    res.status(500).json({ error: 'Server error while updating password.' });
  }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN APPLICATION ROUTES (no session middleware — HTML
//  handles auth state; add express-session for production)
// ═══════════════════════════════════════════════════════════

// GET /api/applications — list all with tracking
app.get('/api/applications', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM applications ORDER BY created_at DESC');
    const [trRows] = await pool.execute('SELECT * FROM loan_tracking');
    const trackingMap = new Map();
    for (const t of trRows) {
      trackingMap.set(String(t.application_id), {
        month: t.month, entity: t.entity, connector: t.connector,
        applicant: t.applicant, businessEmployer: t.business_employer,
        category: t.category, mobileNo: t.mobile_no, emailId: t.email_id,
        bankNbfc: t.bank_nbfc, smName: t.sm_name, product: t.product,
        freshBtTopup: t.fresh_bt_topup, creditProgram: t.credit_program,
        loginDate: t.login_date, appliedAmount: t.applied_amount,
        decisionDate: t.decision_date, decision: t.decision,
        sanctionedAmount: t.sanctioned_amount, disbDate: t.disb_date,
        disbAmount: t.disb_amount, ll: t.ll, gx: t.gx, pf: t.pf,
        roi: t.roi, emi: t.emi, tenure: t.tenure,
        ddRtgsAmount: t.dd_rtgs_amount, ddRtgsDate: t.dd_rtgs_date,
        deviation: t.deviation, appId: t.app_id, noi: t.noi, remark: t.remark,
      });
    }
    const apps = rows.map(r => {
      const appObj = rowToApp(r);
      appObj.tracking = trackingMap.get(String(r.id)) || null;
      return appObj;
    });
    res.json(apps);
  } catch (e) {
    console.error('GET /api/applications error:', e);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/applications/:id/tracking — save 32 tracking fields
app.patch('/api/applications/:id/tracking', async (req, res) => {
  try {
    const d = req.body;
    const id = req.params.id;
    await pool.execute(`
      INSERT INTO loan_tracking (
        application_id, month, entity, connector, applicant, business_employer,
        category, mobile_no, email_id, bank_nbfc, sm_name, product, fresh_bt_topup,
        credit_program, login_date, applied_amount, decision_date, decision,
        sanctioned_amount, disb_date, disb_amount, ll, gx, pf, roi, emi, tenure,
        dd_rtgs_amount, dd_rtgs_date, deviation, app_id, noi, remark
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE
        month=VALUES(month), entity=VALUES(entity), connector=VALUES(connector),
        applicant=VALUES(applicant), business_employer=VALUES(business_employer),
        category=VALUES(category), mobile_no=VALUES(mobile_no), email_id=VALUES(email_id),
        bank_nbfc=VALUES(bank_nbfc), sm_name=VALUES(sm_name), product=VALUES(product),
        fresh_bt_topup=VALUES(fresh_bt_topup), credit_program=VALUES(credit_program),
        login_date=VALUES(login_date), applied_amount=VALUES(applied_amount),
        decision_date=VALUES(decision_date), decision=VALUES(decision),
        sanctioned_amount=VALUES(sanctioned_amount), disb_date=VALUES(disb_date),
        disb_amount=VALUES(disb_amount), ll=VALUES(ll), gx=VALUES(gx), pf=VALUES(pf),
        roi=VALUES(roi), emi=VALUES(emi), tenure=VALUES(tenure),
        dd_rtgs_amount=VALUES(dd_rtgs_amount), dd_rtgs_date=VALUES(dd_rtgs_date),
        deviation=VALUES(deviation), app_id=VALUES(app_id), noi=VALUES(noi),
        remark=VALUES(remark), updated_at=CURRENT_TIMESTAMP`,
      [
        id,
        d.month || null, d.entity || null, d.connector || null, d.applicant || null, d.businessEmployer || null,
        d.category || null, d.mobileNo || null, d.emailId || null, d.bankNbfc || null, d.smName || null,
        d.product || null, d.freshBtTopup || null, d.creditProgram || null, d.loginDate || null,
        d.appliedAmount || null, d.decisionDate || null, d.decision || null, d.sanctionedAmount || null,
        d.disbDate || null, d.disbAmount || null, d.ll || null, d.gx || null, d.pf || null,
        d.roi || null, d.emi || null, d.tenure || null, d.ddRtgsAmount || null, d.ddRtgsDate || null,
        d.deviation || null, d.appId || null, d.noi || null, d.remark || null,
      ]
    );
    res.status(204).end();
  } catch (e) {
    console.error('PATCH tracking error:', e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/applications/:id
app.get('/api/applications/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found.' });
    res.json(rowToApp(rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/applications/:id — update full record (from edit modal)
app.put('/api/applications/:id', async (req, res) => {
  try {
    const d = req.body;
    const aadhaarEncrypted = d.aadhaar ? encrypt(d.aadhaar) : undefined;

    const fields = [
      ['status', d.status],
      ['applicant_role', d.applicantRole],
      ['applicant_type', d.applicantType],
      ['loan_products', d.loanProducts ? JSON.stringify(d.loanProducts) : undefined],
      ['assigned_product', d.assignedProduct],
      ['first_name', d.firstName],
      ['middle_name', d.middleName],
      ['last_name', d.lastName],
      ['gender', d.gender],
      ['marital_status', d.maritalStatus],
      ['education', d.education],
      ['residency_status', d.residencyStatus],
      ['dob', d.dob],
      ['father_name', d.fatherName],
      ['mothers_maiden_name', d.mothersMaidenName],
      ['pan_number', d.panNumber],
      ['aadhaar', aadhaarEncrypted],
      ['curr_address', d.currAddress],
      ['curr_city', d.currCity],
      ['curr_state', d.currState],
      ['curr_pincode', d.currPincode],
      ['curr_occupancy', d.currOccupancy],
      ['curr_vintage', d.currVintage],
      ['curr_contact', d.currContact],
      ['perm_address', d.permAddress],
      ['perm_city', d.permCity],
      ['perm_state', d.permState],
      ['perm_pincode', d.permPincode],
      ['perm_occupancy', d.permOccupancy],
      ['perm_vintage', d.permVintage],
      ['perm_distance', d.permDistance],
      ['perm_email', d.permEmail],
      ['perm_contact', d.permContact],
      ['employer_name', d.employerName],
      ['office_address', d.officeAddress],
      ['designation', d.designation],
      ['emp_vintage', d.empVintage],
      ['emp_distance', d.empDistance],
      ['emp_email', d.empEmail],
      ['emp_contact', d.empContact],
      ['business_name', d.businessName],
      ['business_type', d.businessType],
      ['business_address', d.businessAddress],
      ['business_vintage', d.businessVintage],
      ['gst_number', d.gstNumber],
      ['business_contact', d.businessContact],
      ['branch', d.branch],
      ['rm_name', d.rmName],
      ['loan_purpose', d.loanPurpose],
      ['requested_amount', d.requestedAmount],
      ['tenure_months', d.tenureMonths],
      ['passport_no', d.passportNo],
      ['voter_id', d.voterId],
      ['driving_licence', d.drivingLicence],
      ['has_coborrower', d.hasCoborrower !== undefined ? (d.hasCoborrower ? 1 : 0) : undefined],
      ['coborrower_json', d.coborrower !== undefined ? (d.coborrower ? JSON.stringify(d.coborrower) : null) : undefined],
      ['industry', d.industry],
      ['experience_years', d.experienceYears],
      ['annual_income', d.annualIncome],
      ['gross_income', d.grossIncome],
      ['net_income', d.netIncome],
      ['other_income', d.otherIncome],
      ['rental_income', d.rentalIncome],
      ['agri_income', d.agriIncome],
      ['existing_emi', d.existingEmi],
      ['monthly_obligations', d.monthlyObligations],
      ['bank_accounts_json', d.bankAccounts !== undefined ? (d.bankAccounts ? JSON.stringify(d.bankAccounts) : null) : undefined],
      ['existing_loans_json', d.existingLoans !== undefined ? (d.existingLoans ? JSON.stringify(d.existingLoans) : null) : undefined],
      ['property_details_json', d.propertyDetails !== undefined ? (d.propertyDetails ? JSON.stringify(d.propertyDetails) : null) : undefined],
      ['business_details_json', d.businessDetails !== undefined ? (d.businessDetails ? JSON.stringify(d.businessDetails) : null) : undefined],
      ['references_json', d.references !== undefined ? (d.references ? JSON.stringify(d.references) : null) : undefined],
      ['documents_checklist_json', d.documentsChecklist !== undefined ? (d.documentsChecklist ? JSON.stringify(d.documentsChecklist) : null) : undefined],
    ].filter(([, v]) => v !== undefined);

    const setClauses = fields.map(([col]) => `${col} = ?`).join(', ');
    const values = fields.map(([, v]) => v);
    values.push(req.params.id);

    await pool.execute(`UPDATE applications SET ${setClauses} WHERE id = ?`, values);

    const [updated] = await pool.execute('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    res.json(rowToApp(updated[0]));
  } catch (e) {
    console.error('PUT /api/applications/:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/applications/:id/status
app.patch('/api/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });
    await pool.execute('UPDATE applications SET status = ? WHERE id = ?', [status, req.params.id]);
    const [rows] = await pool.execute('SELECT * FROM applications WHERE id = ?', [req.params.id]);
    res.json(rowToApp(rows[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/applications/:id
app.delete('/api/applications/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM applications WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/audit-log/clear — wipe all audit log entries
app.delete('/api/audit-log/clear', async (req, res) => {
  try {
    await pool.execute('TRUNCATE TABLE audit_log');
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/audit-log/:id — delete single audit log entry
app.delete('/api/audit-log/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM audit_log WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/audit-log — fetch audit log entries
app.get('/api/audit-log', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 500');
    res.json(rows.map(r => ({
      id: r.id,
      admin: r.admin_user,
      action: r.action,
      detail: r.detail,
      ip: r.ip_address,
      ts: new Date(r.created_at).toLocaleString('en-IN'),
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/audit-log — write audit entry from frontend
app.post('/api/audit-log', async (req, res) => {
  try {
    const { action, detail, adminUser } = req.body;
    await writeAudit(action, detail, req.ip, adminUser);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// ─── Serve the HTML app for all GET requests ──────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'skyfinserv-app.html'));
});

const os = require('os');
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
async function startServer(targetPort = PORT) {
  await setupDatabase();
  return new Promise((resolve, reject) => {
    const tryListen = (p) => {
      const server = app.listen(p, '0.0.0.0', () => {
        const actualPort = server.address().port;
        const lanIp = getLocalIpAddress();
        console.log(`\n🚀 SkyFinserv Local Office Cloud active!`);
        console.log(`📌 On this Host PC:       http://localhost:${actualPort}`);
        console.log(`🌐 On Other Office PCs:   http://${lanIp}:${actualPort}`);
        console.log(`🔑 Admin Login:           username=admin  password=admin123\n`);
        resolve({ server, port: actualPort });
      });
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && p !== 0) {
          console.warn(`⚠️ Port ${p} is in use, auto-assigning available port...`);
          tryListen(0);
        } else {
          reject(err);
        }
      });
    };
    tryListen(targetPort);
  });
}

if (require.main === module) {
  startServer().catch(e => {
    console.error('❌ Startup failed:', e.message);
    process.exit(1);
  });
}

module.exports = { app, startServer, setupDatabase };


