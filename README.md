# Acadex - Education ERP System Setup Guide

Welcome to Acadex! This guide will help you install and run this application on your local computer. It is written to be friendly for everyone—even if you are not a developer or technical person.

---

## 🛠️ Step 1: Install Required Software (One-time Setup)

You need three free programs running on your computer to run Acadex:
1. **Node.js** (runs the application logic)
2. **Git** (downloads and manages the project code)
3. **PostgreSQL** (the database that stores the application's data)

Follow the list below depending on your computer's operating system:

### 🪟 If you are on Windows:
1. **Node.js & Git:**
   * Download and run the **Node.js** installer from the [Node.js Official Website](https://nodejs.org/) (choose the **LTS** version).
   * Download and run the **Git** installer from the [Git Official Website](https://git-scm.com/).
2. **PostgreSQL (Database):**
   * Download the database installer from the [PostgreSQL Windows Downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
   * Open the installer and click **Next** through the options.
   * **Important:** During setup, you will be asked to set a **password** for the database. Write this password down! We will need it in Step 3.
   * Finish the installation. The database will start automatically in the background.

---

### 🍎 If you are on macOS (Mac):
1. **Open the Terminal app** (Press `Cmd + Space`, type "Terminal", and press Enter).
2. **Install Node.js & Git:**
   * If you have Homebrew installed, run:
     ```bash
     brew install node git
     ```
   * If not, download and run the installer from the [Node.js Official Website](https://nodejs.org/).
3. **Install & Start PostgreSQL:**
   * Run the following commands in your Terminal:
     ```bash
     # 1. Install PostgreSQL
     brew install postgresql@16

     # 2. Start PostgreSQL in the background
     brew services start postgresql@16

     # 3. Link the database commands to your system
     brew link postgresql@16 --force
     ```

---

### 🐧 If you are on Linux (Ubuntu/Debian):
1. Open your terminal and install everything by running:
   ```bash
   sudo apt update
   sudo apt install nodejs npm git postgresql postgresql-contrib
   ```
2. Start and enable the database:
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

---

## 🗄️ Step 2: Create the Database

We need to create a blank database container named `edu_erp` where Acadex can store its tables.

1. **Open your Terminal (macOS/Linux) or Command Prompt/PowerShell (Windows).**
2. **Connect to PostgreSQL:**
   * **Windows:** Run:
     ```cmd
     psql -U postgres
     ```
   * **macOS / Linux:** Run:
     ```bash
     psql postgres
     ```
3. **Run these commands one-by-one inside the database prompt:**
   *(Replace `<your_secure_password>` with the password you set during installation, or create a new password).*
   ```sql
   -- 1. Create the database user and password:
   CREATE ROLE postgres WITH LOGIN PASSWORD '<your_secure_password>' SUPERUSER;

   -- 2. Create the blank database:
   CREATE DATABASE edu_erp OWNER postgres;

   -- 3. Exit the database:
   \q
   ```

---

## ⚙️ Step 3: Configure and Run the Backend (The Engine)

The backend acts as the engine of the application. It handles calculations, database queries, and security.

1. **Open your terminal inside the `backend` folder** of the project.
2. **Install the package files:**
   Run the following command to download necessary libraries:
   ```bash
   npm install
   ```
3. **Set up the Configuration File:**
   Create a copy of the configuration template:
   * **macOS / Linux:** `cp .env.example .env`
   * **Windows:** `copy .env.example .env`
4. **Edit the configuration (`.env`):**
   Open the newly created `.env` file in any text editor (like Notepad, TextEdit, or VS Code) and update the database link:
   ```env
   # Replace <your_password> with the database password you created in Step 2:
   DATABASE_URL="postgresql://postgres:<your_password>@localhost:5432/edu_erp?schema=public"
   PORT=5000
   JWT_SECRET="your_custom_secret_key"
   JWT_EXPIRES_IN="7d"
   CORS_ORIGIN="http://localhost:5173"
   ```
5. **Prepare the database tables:**
   Run the following command to automatically build the tables and structure:
   ```bash
   npx prisma migrate dev
   ```
   *(When prompted to "Enter a name for the new migration", type `init` and press Enter).*
6. **Load initial/sample data:**
   Run this command to insert default settings and demo accounts:
   ```bash
   npx prisma db seed
   ```
7. **Start the backend server:**
   ```bash
   npm run dev
   ```
   *Keep this window open! The backend needs to remain running.*

---

## 💻 Step 4: Configure and Run the Frontend (The Screens)

The frontend is the visual website interface that you see and interact with in your browser.

1. **Open a new terminal window inside the `frontend` folder.**
2. **Install the visual libraries:**
   ```bash
   npm install
   ```
3. **Start the visual application:**
   ```bash
   npm run dev
   ```
4. **Open your browser and visit:**
   ```text
   http://localhost:5173
   ```

You are all set! The Acadex application is now fully running.

---

## 🔑 Default Accounts & Temporary Credentials

After launching the application, you can log in using the following credentials:

### 1. Default Administrator / Super Admin Accounts
These accounts are created automatically when you run the database seed command (`npx prisma db seed`).
*   **Email:** `superadmin@eduerp.com`
    *   **Password:** `AdminSecretPass123`
*   **Email:** `mddesai207@gmail.com`
    *   **Password:** `Madhav12@`

### 2. Auto-Generated Credentials (Faculty & Students)
When you register a new faculty member or enroll a student, the system automatically generates their credentials. The login email will be the one provided during registration, and the auto-generated temporary password follows these formats:

*   **Faculty Members:**
    *   **Email:** The email specified during faculty registration.
    *   **Temporary Password:** `FAC@<employeeCode>`
    *   *Example:* If the generated employee code is `FAC-2026-001`, the temporary password is `FAC@FAC-2026-001`.
*   **Students:**
    *   **Email:** The email specified during student enrollment/admission.
    *   **Temporary Password:** `STUD@<rollNumber>`
    *   *Example:* If the generated student roll number is `CS-2026-001`, the temporary password is `STUD@CS-2026-001`.

> [!NOTE]
> **First-Time Password Change:**
> To ensure system security, when any Faculty or Student logs in for the first time using their auto-generated temporary password starting with `FAC@` or `STUD@`, the frontend will automatically intercept the login and prompt them to set a new, secure custom password before they can access the dashboard.
