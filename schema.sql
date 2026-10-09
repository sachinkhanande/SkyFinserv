-- =====================================================================
-- SkyFinserv Loan Application Portal - MySQL Database Schema
-- File: schema.sql
-- Instructions:
--   1. Open MySQL Workbench.
--   2. Click File -> Open SQL Script... and select this file (schema.sql).
--   3. Click the Execute (Lightning bolt) icon or press Ctrl + Shift + Enter.
-- =====================================================================

-- Step 1: Create Database
CREATE DATABASE IF NOT EXISTS `skyfinserv`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `skyfinserv`;

-- Step 2: Users Table (Portal Users / Applicants)
CREATE TABLE IF NOT EXISTS `users` (
  `id`                    INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`               VARCHAR(50)  UNIQUE NOT NULL,
  `password_hash`         VARCHAR(255) NOT NULL,
  `display_name`          VARCHAR(100),
  `application_no`        VARCHAR(50),
  `is_permitted`          TINYINT(1) DEFAULT 1,
  `security_question`     VARCHAR(255) NULL,
  `security_answer_hash`  VARCHAR(255) NULL,
  `created_at`            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `approved_at`           TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id`                    INT AUTO_INCREMENT PRIMARY KEY,
  `username`              VARCHAR(100) UNIQUE NOT NULL,
  `password_hash`         VARCHAR(255) NOT NULL,
  `display_name`          VARCHAR(100) DEFAULT 'Administrator',
  `role`                  VARCHAR(50)  DEFAULT 'Admin',
  `security_question`     VARCHAR(255) NULL,
  `security_answer_hash`  VARCHAR(255) NULL,
  `created_at`            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Loan Applications Table
CREATE TABLE IF NOT EXISTS `applications` (
  `id`                       INT AUTO_INCREMENT PRIMARY KEY,
  `app_no`                   VARCHAR(100) UNIQUE,
  `status`                   VARCHAR(30)  DEFAULT 'Submitted',
  `created_at`               BIGINT,

  `applicant_role`           VARCHAR(30),
  `applicant_type`           VARCHAR(50),
  `loan_products`            TEXT,
  `loan_sub_category`        VARCHAR(150),
  `assigned_product`         VARCHAR(150),

  `first_name`               VARCHAR(100),
  `middle_name`              VARCHAR(100),
  `last_name`                VARCHAR(100),
  `gender`                   VARCHAR(20),
  `marital_status`           VARCHAR(30),
  `education`                VARCHAR(100),
  `residency_status`         VARCHAR(30)  DEFAULT 'Indian',
  `dob`                      VARCHAR(20),
  `father_name`              VARCHAR(150),
  `mothers_maiden_name`      VARCHAR(150),
  `pan_number`               VARCHAR(20),
  `aadhaar`                  VARCHAR(255),

  `curr_address`             TEXT,
  `curr_city`                VARCHAR(100),
  `curr_state`               VARCHAR(100),
  `curr_pincode`             VARCHAR(20),
  `curr_occupancy`           VARCHAR(50),
  `curr_vintage`             VARCHAR(50),
  `curr_contact`             VARCHAR(30),

  `perm_address`             TEXT,
  `perm_city`                VARCHAR(100),
  `perm_state`               VARCHAR(100),
  `perm_pincode`             VARCHAR(20),
  `perm_occupancy`           VARCHAR(50),
  `perm_vintage`             VARCHAR(50),
  `perm_distance`            VARCHAR(50),
  `perm_email`               VARCHAR(150),
  `perm_contact`             VARCHAR(30),

  `employer_name`            VARCHAR(150),
  `office_address`           TEXT,
  `designation`              VARCHAR(100),
  `emp_vintage`              VARCHAR(50),
  `emp_distance`             VARCHAR(50),
  `emp_email`                VARCHAR(150),
  `emp_contact`              VARCHAR(30),

  `business_name`            VARCHAR(150),
  `business_type`            VARCHAR(100),
  `business_address`         TEXT,
  `business_vintage`         VARCHAR(50),
  `gst_number`               VARCHAR(20),
  `business_contact`         VARCHAR(30),

  /* Additional master form fields */
  `branch`                   VARCHAR(100),
  `rm_name`                  VARCHAR(150),
  `connector`                VARCHAR(150),
  `loan_purpose`             VARCHAR(200),
  `requested_amount`         DECIMAL(15,2),
  `tenure_months`            INT,
  `passport_no`              VARCHAR(50),
  `voter_id`                 VARCHAR(50),
  `driving_licence`          VARCHAR(50),
  `has_coborrower`           TINYINT(1) DEFAULT 0,
  `coborrower_json`          LONGTEXT,
  `industry`                 VARCHAR(150),
  `experience_years`         VARCHAR(50),
  `annual_income`            DECIMAL(15,2),
  `gross_income`             DECIMAL(15,2),
  `net_income`               DECIMAL(15,2),
  `other_income`             DECIMAL(15,2),
  `rental_income`            DECIMAL(15,2),
  `agri_income`              DECIMAL(15,2),
  `existing_emi`             DECIMAL(15,2),
  `monthly_obligations`      DECIMAL(15,2),
  `bank_accounts_json`       LONGTEXT,
  `existing_loans_json`      LONGTEXT,
  `property_details_json`    LONGTEXT,
  `business_details_json`    LONGTEXT,
  `references_json`          LONGTEXT,
  `documents_checklist_json` LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Loan Tracking Table
CREATE TABLE IF NOT EXISTS `loan_tracking` (
  `id`                INT AUTO_INCREMENT PRIMARY KEY,
  `application_id`    INT UNIQUE,
  `month`             VARCHAR(20),
  `entity`            VARCHAR(150),
  `connector`         VARCHAR(150),
  `applicant`         VARCHAR(150),
  `business_employer` VARCHAR(150),
  `category`          VARCHAR(50),
  `mobile_no`         VARCHAR(20),
  `email_id`          VARCHAR(150),
  `bank_nbfc`         VARCHAR(150),
  `sm_name`           VARCHAR(150),
  `product`           VARCHAR(150),
  `fresh_bt_topup`    VARCHAR(50),
  `credit_program`    VARCHAR(150),
  `login_date`        VARCHAR(20),
  `applied_amount`    DECIMAL(15,2),
  `decision_date`     VARCHAR(20),
  `decision`          VARCHAR(50),
  `sanctioned_amount` DECIMAL(15,2),
  `disb_date`         VARCHAR(20),
  `disb_amount`       DECIMAL(15,2),
  `ll`                DECIMAL(15,2),
  `gx`                DECIMAL(15,2),
  `pf`                DECIMAL(15,2),
  `roi`               DECIMAL(8,4),
  `emi`               DECIMAL(15,2),
  `tenure`            INT,
  `dd_rtgs_amount`    DECIMAL(15,2),
  `dd_rtgs_date`      VARCHAR(20),
  `deviation`         TEXT,
  `app_id`            VARCHAR(100),
  `noi`               DECIMAL(15,2),
  `remark`            TEXT,
  `updated_at`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tracking_application`
    FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 6: DM Records (Disbursement & Management Tracker)
CREATE TABLE IF NOT EXISTS `dm_records` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `month`           VARCHAR(50),
  `entity`          VARCHAR(150),
  `connector`       VARCHAR(150),
  `applicant`       VARCHAR(150),
  `employer`        VARCHAR(150),
  `category`        VARCHAR(100),
  `bank`            VARCHAR(150),
  `rm_name`         VARCHAR(150),
  `product`         VARCHAR(150),
  `program`         VARCHAR(150),
  `credit_program`  VARCHAR(150),
  `login_date`      VARCHAR(20),
  `applied_amount`  VARCHAR(50),
  `decision_date`   VARCHAR(20),
  `decision`        VARCHAR(100),
  `sanction_amount` VARCHAR(50),
  `disb_date`       VARCHAR(20),
  `disb_amount`     VARCHAR(50),
  `li`              VARCHAR(50),
  `gi`              VARCHAR(50),
  `pf`              VARCHAR(50),
  `roi`             VARCHAR(50),
  `emi`             VARCHAR(50),
  `tenure`          VARCHAR(50),
  `pdc_amount`      VARCHAR(50),
  `pdc_date`        VARCHAR(20),
  `queries`         TEXT,
  `app_id`          VARCHAR(100),
  `noi_date`        VARCHAR(20),
  `remark`          TEXT,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 7: Audit Log Table
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `admin_user` VARCHAR(100),
  `action`     VARCHAR(100),
  `detail`     TEXT,
  `ip_address` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 8: Financial Datasheets Table
CREATE TABLE IF NOT EXISTS `financial_datasheets` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `title`          VARCHAR(255),
  `application_id` VARCHAR(100),
  `datasheet_json` LONGTEXT,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 9: App Settings Table
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_key`   VARCHAR(100) PRIMARY KEY,
  `setting_val`   LONGTEXT,
  `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 10: Seed Default Super Admin Account
-- Default Credentials -> Username: admin | Password: admin123
INSERT INTO `admins` (`username`, `password_hash`, `display_name`, `role`)
SELECT 'admin', '$2a$12$KP5jlT8x9DXa04l1Hhx.PeCyXdQdNKhBE2PUcYyAOMENQ/sqh6qaK', 'Super Admin', 'SuperAdmin'
WHERE NOT EXISTS (SELECT 1 FROM `admins` WHERE `username` = 'admin');

-- Completed successfully!
