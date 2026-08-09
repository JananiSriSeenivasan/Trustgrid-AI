# Deployment Guide

## Security Assistance

### Cybersecurity Risk Assessment and Vulnerability Intelligence Platform

This document explains how to install, configure, and run the Security Assistance application in a local development or demonstration environment.

---

# 1. Deployment Overview

Security Assistance consists of three main components:

* **Frontend** — React and Vite
* **Backend** — Python and FastAPI
* **Database** — MongoDB

The application is designed to run locally using the following architecture:

```text
Browser
   |
   v
React + Vite Frontend
http://localhost:5173
   |
   | REST API
   v
FastAPI Backend
http://127.0.0.1:8000
   |
   v
MongoDB
mongodb://localhost:27017
```

For the hackathon demonstration, the application can be run as a local working prototype.

---

# 2. System Requirements

Before running the project, ensure the following software is installed.

## Required Software

* Python 3.10 or later
* Node.js and npm
* MongoDB Community Server
* Nmap
* Git

## Recommended Development Environment

* Windows 10 or Windows 11
* PowerShell
* Visual Studio Code

---

# 3. Clone the Repository

Clone the project repository:

```bash
git clone https://github.com/JananiSriSeenivasan/Trustgrid-AI.git
```

Navigate to the project directory:

```bash
cd Trustgrid-AI
```

Then navigate to the Security Assistance project:

```bash
cd "Security Assistance"
```

The project structure should look similar to:

```text
Trustgrid-AI/
|
+-- Security Assistance/
    |
    +-- backend/
    |
    +-- frontend/
    |
    +-- README.md
    |
    +-- DEPLOYMENT_GUIDE.md
```

---

# 4. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows:

```powershell
venv\Scripts\activate
```

When activated, the terminal should display something similar to:

```text
(venv)
```

Install the required Python dependencies:

```bash
pip install -r requirements.txt
```

---

# 5. Environment Configuration

Configure the backend environment variables if required by your local setup.

Create a file named:

```text
.env
```

inside the `backend` directory.

Example configuration:

```env
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=security_assistance

JWT_SECRET_KEY=replace-with-a-strong-secret-key

NMAP_PATH=C:\Program Files (x86)\Nmap\nmap.exe
```

The exact Nmap installation path may differ depending on the operating system and installation location.

For production environments, secrets should not be hardcoded or committed to GitHub.

---

# 6. MongoDB Setup

Ensure that MongoDB is installed and running.

The default local MongoDB connection is:

```text
mongodb://localhost:27017/
```

The application uses MongoDB to store information such as:

* User data
* Scan history
* Discovered assets
* Vulnerability findings
* Risk analysis data
* Recommendations
* Security assessment results

The default database name used in the example configuration is:

```text
security_assistance
```

If MongoDB is running successfully, the backend should be able to connect when the application starts.

---

# 7. Nmap Setup

Security Assistance uses Nmap-based network discovery when available.

Install Nmap and ensure that the executable is accessible.

Example Windows installation path:

```text
C:\Program Files (x86)\Nmap\nmap.exe
```

If Nmap is installed in another location, update the configuration accordingly.

The application supports demonstration or synthetic scan modes where available, allowing the project to be demonstrated without performing a live network scan.

Live scanning must only be performed against authorized systems.

---

# 8. Run the Backend

From the `backend` directory, with the virtual environment activated, run:

```bash
uvicorn app.main:app --reload
```

The backend should start on:

```text
http://127.0.0.1:8000
```

You should see output similar to:

```text
INFO: Uvicorn running on http://127.0.0.1:8000
```

The `--reload` option automatically reloads the server when backend code changes.

---

# 9. Verify the Backend

Open the FastAPI interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

Alternative API documentation is available at:

```text
http://127.0.0.1:8000/redoc
```

The API documentation can be used to verify that backend routes are available.

---

# 10. Frontend Setup

Open a second terminal.

If you are currently inside the `backend` directory, move to the frontend directory:

```powershell
cd ..\frontend
```

Alternatively, from the `Security Assistance` directory:

```powershell
cd frontend
```

Install the required Node.js dependencies:

```bash
npm install
```

After installation, start the Vite development server:

```bash
npm run dev
```

Vite will display a local URL similar to:

```text
http://localhost:5173/
```

Open the displayed URL in a web browser.

---

# 11. Run the Complete Application

For the full application, keep the following services running simultaneously.

## Terminal 1 — MongoDB

MongoDB should be running locally.

```text
MongoDB
   |
   v
mongodb://localhost:27017
```

## Terminal 2 — Backend

Navigate to:

```text
Security Assistance/backend
```

Activate the virtual environment:

```powershell
venv\Scripts\activate
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

## Terminal 3 — Frontend

Navigate to:

```text
Security Assistance/frontend
```

Install dependencies if they have not already been installed:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

The complete application architecture is:

```text
+---------------------------+
|        Web Browser        |
+-------------+-------------+
              |
              v
+---------------------------+
|   React + Vite Frontend   |
|   http://localhost:5173   |
+-------------+-------------+
              |
              | REST API
              v
+---------------------------+
|      FastAPI Backend      |
|  http://127.0.0.1:8000    |
+-------------+-------------+
              |
              v
+---------------------------+
|          MongoDB          |
| mongodb://localhost:27017 |
+---------------------------+
```

---

# 12. Testing the Application

After starting the application, verify the following features.

## Backend

Open:

```text
http://127.0.0.1:8000/docs
```

Verify that the API endpoints are available.

## Frontend

Open:

```text
http://localhost:5173
```

Verify that the following pages and features are accessible:

* Dashboard
* Network scanning
* Asset inventory
* Vulnerability analysis
* Risk analysis
* Recommendations
* Scan history
* Report generation
* Security assistant

---

# 13. Demo Scan

For a hackathon demonstration, use the project's demo or synthetic scan mode where appropriate.

Example request:

```text
POST /scan?target=192.168.1.12&mode=demo
```

The assessment pipeline processes the following stages:

```text
1. Network Discovery
2. Asset Classification
3. Vulnerability Detection
4. Threat Intelligence Enrichment
5. Vulnerability Prioritization
6. Risk Analysis
7. Scan Storage
8. Dashboard and Report Generation
```

Demo mode allows the application's workflow and security analysis capabilities to be demonstrated in a controlled environment.

---

# 14. Live Scan Authorization

The application may support authorized live scanning.

Example:

```text
POST /scan?target=192.168.1.12&mode=live&authorized=true
```

Live scanning must only be performed against:

* Systems you own
* Systems you administer
* Authorized laboratory environments
* Systems where explicit permission has been obtained

Unauthorized network scanning may be illegal or unethical.

---

# 15. Common Problems and Solutions

## Problem: Python command is not recognized

Verify that Python is installed:

```bash
python --version
```

If Python is not recognized, reinstall Python and ensure that Python is added to the system PATH.

---

## Problem: Virtual environment does not activate

On Windows PowerShell, try:

```powershell
venv\Scripts\Activate.ps1
```

If PowerShell blocks script execution, use the appropriate PowerShell execution policy for your development environment.

---

## Problem: `uvicorn` is not recognized

Ensure the virtual environment is activated:

```powershell
venv\Scripts\activate
```

Then reinstall dependencies:

```bash
pip install -r requirements.txt
```

---

## Problem: MongoDB connection fails

Check that MongoDB is running.

Verify the connection string:

```text
mongodb://localhost:27017/
```

Also verify the MongoDB configuration in the backend environment variables.

---

## Problem: Nmap is not found

Verify that Nmap is installed.

Check the configured path:

```text
C:\Program Files (x86)\Nmap\nmap.exe
```

Update the `NMAP_PATH` value if Nmap is installed in a different location.

---

## Problem: Frontend cannot connect to backend

Verify that the FastAPI backend is running:

```text
http://127.0.0.1:8000
```

Check the frontend API configuration.

Also verify that the backend CORS configuration allows requests from the frontend development server.

---

## Problem: Port is already in use

If port `8000` is already in use, another application may be running on that port.

Close the conflicting process or run the backend on another port:

```bash
uvicorn app.main:app --reload --port 8001
```

If the backend port changes, update the frontend API configuration accordingly.

---

# 16. Local Deployment Status

For the current hackathon version, Security Assistance is deployed as a local working prototype.

The application runs using:

* Local React and Vite frontend
* Local FastAPI backend
* Local MongoDB database
* Local Nmap installation where required

This setup provides a functional environment for development, testing, and demonstration.

Cloud deployment can be considered as a future enhancement using services such as:

* Vercel for the frontend
* Render, Railway, or a cloud VM for the backend
* MongoDB Atlas for the database

Because the application includes network-scanning functionality, a future cloud deployment should include additional security controls, authorization restrictions, environment-based configuration, secure secret management, and network access restrictions.

---

# 17. Security Notice

Security Assistance is intended for educational, research, demonstration, and authorized security assessment purposes.

Users must ensure that all network scanning and security testing activities are performed only against systems for which they have explicit authorization.

Do not use the platform to scan, test, or access networks or systems without permission.

---

# Security Assistance

**Discover. Analyze. Prioritize. Remediate.**

Security Assistance transforms network and vulnerability data into meaningful security intelligence and actionable remediation priorities.
