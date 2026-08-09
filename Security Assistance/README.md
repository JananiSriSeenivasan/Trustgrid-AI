# Security Assistance

## Cybersecurity Risk Assessment and Vulnerability Intelligence Platform

Security Assistance is a cybersecurity risk assessment and vulnerability intelligence platform designed to help security teams discover network assets, identify security weaknesses, analyze enterprise risk, prioritize remediation, and generate actionable security insights.

The platform transforms raw network scan data into meaningful security intelligence by combining network discovery, asset classification, vulnerability detection, threat intelligence, CVSS severity scoring, EPSS exploit probability, asset criticality, risk analysis, remediation prioritization, reporting, and an evidence-grounded security assistant.

---

# Table of Contents

- [Project Overview](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#project-overview)
- [Key Features](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#key-features)
- [System Workflow](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#system-workflow)
- [System Architecture](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#system-architecture)
- [Technology Stack](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#technology-stack)
- [Project Structure](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#project-structure)
- [Installation and Setup](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#installation-and-setup)
- [Running the Application](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#running-the-application)
- [API Endpoints](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#api-endpoints)
- [Security Concepts](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#security-concepts)
- [Security and Authorization](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#security-and-authorization)
- [Limitations](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#limitations)
- [Future Enhancements](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#future-enhancements)
- [Disclaimer](https://chatgpt.com/c/6a781d98-c094-83ee-92c6-ccc09f7df361#disclaimer)

---

# Project Overview

Modern organizations manage a large number of devices, services, vulnerabilities, and security risks across their infrastructure. Security teams must determine not only what vulnerabilities exist, but also which vulnerabilities present the greatest risk and should be addressed first.

Security Assistance helps answer questions such as:

- Which assets exist within the network?
- Which ports and services are exposed?
- What security weaknesses were detected?
- Which vulnerabilities have the highest technical severity?
- How likely is a vulnerability to be exploited?
- Which assets are most critical to the organization?
- Which vulnerabilities should be remediated first?
- What actions should security teams take?

The platform provides an automated assessment pipeline that converts technical security findings into prioritized and actionable recommendations.

---

# Key Features

## Network Scanning

Security Assistance supports multiple target formats:

- IP address scanning
- CIDR network scanning
- Hostname scanning
- Demo scan mode
- Authorized live scan mode
- Automatic scan mode selection
- Authorization confirmation for live scanning
- Asynchronous background scanning

The platform uses Nmap-based discovery when available. For demonstrations and offline environments, it can use clearly labelled demo or synthetic telemetry.

---

## Asset Discovery and Classification

The platform discovers network assets and collects information such as:

- IP address
- Hostname
- MAC address
- Operating system
- Open ports
- Running services
- Service versions
- Scan evidence
- Asset type
- Business criticality

Assets can be classified into categories such as:

- Servers
- Web servers
- Domain controllers
- Workstations
- Network devices
- Cameras and IoT devices
- Unknown infrastructure

Asset classification helps the platform understand the importance of each system when calculating overall security risk.

---

## Vulnerability Detection

Security Assistance analyzes discovered services, ports, and versions to identify potential security weaknesses.

Examples include:

- SMBv1 exposure
- Telnet exposure
- Anonymous FTP access
- Unencrypted protocols
- Legacy TLS configurations
- Exposed RDP services
- Vulnerable service versions
- Unnecessary exposed ports

The system also records assessment evidence so that findings can distinguish between:

- Detected findings
- Evidence-supported findings
- Potential findings
- Assessment limitations

---

# System Workflow

```
Target
   |
   v
Network Discovery
   |
   v
Asset Classification
   |
   v
Vulnerability Detection
   |
   v
Threat Intelligence Enrichment
   |
   v
CVSS + EPSS + Asset Criticality Analysis
   |
   v
Risk Analysis
   |
   v
Priority and SLA Assignment
   |
   v
Remediation Recommendations
   |
   v
Dashboard, Reports, and Security Assistant

```

---

# Risk Analysis

Security Assistance calculates an explainable enterprise risk score using multiple security factors.

These include:

- CVSS severity
- EPSS exploit probability
- Evidence confidence
- Asset criticality
- Service exposure
- Vulnerability severity
- Threat intelligence
- Local CVE information

The resulting analysis provides:

- Overall risk score
- Risk level
- Risk factors
- Risk explanation
- High-risk assets
- Important vulnerabilities

---

# CVSS Severity Scoring

CVSS, or the Common Vulnerability Scoring System, is used to estimate the technical severity of a vulnerability.

| CVSS ScoreSeverity |          |
| ------------------ | -------- |
| 9.0 – 10.0         | Critical |
| 7.0 – 8.9          | High     |
| 4.0 – 6.9          | Medium   |
| 0.1 – 3.9          | Low      |

CVSS helps answer:

> How technically severe is this vulnerability?

---

# EPSS Exploit Probability

Security Assistance considers EPSS values where available through threat-intelligence data.

EPSS helps estimate:

> How likely is this vulnerability to be exploited in the real world?

In general:

- A lower EPSS value indicates a lower estimated exploitation probability.
- A higher EPSS value indicates a greater estimated likelihood of exploitation.

CVSS and EPSS provide different types of information:

- **CVSS** → Technical severity
- **EPSS** → Probability of exploitation

Security Assistance combines these signals with asset criticality and evidence confidence to provide more meaningful prioritization.

---

# Vulnerability Prioritization

Not every vulnerability should be remediated with the same urgency.

Security Assistance prioritizes vulnerabilities using factors such as:

- CVSS score
- EPSS score
- Exploit status
- Evidence confidence
- Asset criticality

| PriorityMeaningTypical SLA |                      |          |
| -------------------------- | -------------------- | -------- |
| P1                         | Emergency            | 24 Hours |
| P2                         | Critical Remediation | 72 Hours |
| P3                         | Standard Remediation | 7 Days   |
| P4                         | Routine Maintenance  | 30 Days  |

### Example Priority Logic

A vulnerability may receive a **P1 priority** when:

- Its CVSS score is extremely high
- The vulnerability is strongly supported by evidence
- The affected asset is highly critical
- The vulnerability is known or likely to be actively exploited

A vulnerability may receive a **P2 priority** when:

- The CVSS score is high
- The affected asset has high business criticality
- EPSS indicates an elevated probability of exploitation

This approach provides more context than prioritizing vulnerabilities using CVSS severity alone.

---

# Remediation Recommendations

Security Assistance generates actionable remediation guidance for identified security issues.

Recommendations may include:

- Immediate mitigation actions
- Patch recommendations
- Firewall restrictions
- Service hardening
- Network segmentation
- Compliance mapping
- PowerShell remediation commands
- Bash or Linux remediation commands

The remediation engine can map relevant issues to security frameworks such as:

- NIST SP 800-53
- CIS Controls
- OWASP Top 10

### Example

```
Issue: SMBv1 Enabled

Recommended Actions:
- Disable SMBv1
- Restrict SMB port 445
- Apply relevant security patches
- Segment the affected asset
- Validate the configuration after remediation

```

---

# Evidence-Grounded Security Assistant

Security Assistance includes a security assistant that generates responses using available assessment information and local security logic.

The assistant can use:

- Latest stored scan results
- Discovered assets
- Detected vulnerabilities
- Risk information
- Priority information
- Local CVE intelligence
- Remediation data

Example questions include:

```
What is the highest priority vulnerability?

Why is this asset considered critical?

What should I fix first?

Explain the risk of CVE-XXXX-XXXX.

What vulnerabilities were detected on 192.168.1.12?

```

The goal is to provide security guidance grounded in available assessment evidence rather than returning generic responses unrelated to the scanned environment.

---

# Security Dashboard

The React frontend provides an interactive security dashboard containing:

- Overall risk posture
- Risk score
- Asset statistics
- Vulnerability statistics
- Severity distribution
- Priority information
- Asset inventory
- Vulnerability details
- Remediation recommendations
- Scan history
- Risk analysis
- Network topology visualization
- Risk heat map
- Security assistant

---

# Security Reporting

Security Assistance can generate security assessment reports containing:

- Assessment target
- Scan ID
- Overall risk score
- Risk level
- Total assets scanned
- Total vulnerabilities detected
- Severity breakdown
- Executive summary
- Top remediation actions
- Compliance information

The platform also supports report export functionality, including:

- PDF reports
- CSV exports

These reports are intended to support:

- Security analysts
- Security operations teams
- Security managers
- System administrators
- Auditors

---

# System Architecture

```
+---------------------------------------+
|          React + Vite Frontend        |
|                                       |
| Dashboard | Assets | Risks            |
| Vulnerabilities | History             |
| Recommendations | Security Assistant  |
+-------------------+-------------------+
                    |
                    | REST API
                    v
+---------------------------------------+
|            FastAPI Backend            |
|                                       |
| Scan API                              |
| Asset API                             |
| Risk API                              |
| Vulnerability API                     |
| Recommendation API                    |
| Reports API                           |
| Authentication API                    |
| Security Assistant API                |
+-------------------+-------------------+
                    |
                    v
+---------------------------------------+
|          Security Processing          |
|                                       |
| Network Scanner                       |
| Asset Classifier                      |
| Vulnerability Engine                  |
| Threat Intelligence                   |
| Risk Engine                           |
| Priority Engine                       |
| Remediation Engine                    |
| Report Engine                         |
+-------------------+-------------------+
                    |
                    v
+---------------------------------------+
|               MongoDB                 |
|                                       |
| Scan History                          |
| Assets                                |
| Vulnerabilities                       |
| Users                                 |
+---------------------------------------+

```

---

# Technology Stack

## Frontend

- React
- Vite
- Axios
- React Router
- Recharts
- Framer Motion
- Lucide React

## Backend

- Python
- FastAPI
- Pydantic
- JWT Authentication
- Passlib Password Hashing
- Python-Nmap

## Database

- MongoDB

## Security Technologies and Concepts

- Nmap
- CVSS
- EPSS
- CVE Intelligence
- Vulnerability Management
- Asset Criticality
- Risk Scoring
- Threat Intelligence
- JWT Authentication
- NIST SP 800-53
- CIS Controls
- OWASP Top 10

---

# Project Structure

```
Trustgrid-AI/
|
+-- Security Assistance/
    |
    +-- backend/
    |   |
    |   +-- app/
    |   |   |
    |   |   +-- api/
    |   |   +-- database/
    |   |   +-- models/
    |   |   +-- services/
    |   |   +-- utils/
    |   |   +-- config.py
    |   |   +-- main.py
    |   |
    |   +-- requirements.txt
    |   +-- test_api.py
    |
    +-- frontend/
    |   |
    |   +-- src/
    |   |   +-- components/
    |   |   +-- context/
    |   |   +-- layouts/
    |   |   +-- pages/
    |   |   +-- router/
    |   |   +-- services/
    |   |   +-- App.jsx
    |   |   +-- main.jsx
    |   |
    |   +-- package.json
    |   +-- vite.config.js
    |
    +-- .gitignore
    +-- README.md
    +-- DEPLOYMENT_GUIDE.md

```

---

# Installation and Setup

## 1. Clone the Repository

```
git clone https://github.com/JananiSriSeenivasan/Trustgrid-AI.git

```

Navigate to the Security Assistance project:

```
cd Trustgrid-AI/"Security Assistance"

```

---

## 2. Backend Setup

Navigate to the backend directory:

```
cd backend

```

Create a virtual environment:

```
python -m venv venv

```

Activate the virtual environment on Windows:

```
venv\Scripts\activate

```

On Linux or macOS:

```
source venv/bin/activate

```

Install the required dependencies:

```
pip install -r requirements.txt

```

---

# Environment Configuration

Create a `.env` file inside the `backend` directory if required by your local configuration.

Example:

```
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=security_assistance

JWT_SECRET_KEY=replace-with-a-strong-secret-key

NMAP_PATH=C:\Program Files (x86)\Nmap\nmap.exe

```

For Linux or macOS, configure the Nmap executable path according to your system.

---

# Database Setup

Ensure MongoDB is running locally.

Default MongoDB connection:

```
mongodb://localhost:27017/

```

Example database name:

```
security_assistance

```

---

# Running the Application

## Start the Backend

From the `backend` directory:

```
uvicorn app.main:app --reload

```

The backend will typically be available at:

```
http://127.0.0.1:8000

```

Interactive API documentation:

```
http://127.0.0.1:8000/docs

```

Alternative API documentation:

```
http://127.0.0.1:8000/redoc

```

---

## Start the Frontend

Open another terminal and navigate to:

```
cd Trustgrid-AI/"Security Assistance"/frontend

```

Install dependencies:

```
npm install

```

Start the Vite development server:

```
npm run dev

```

Open the local URL displayed by Vite in your browser.

---

# API Endpoints

| EndpointMethodDescription |      |                                         |
| ------------------------- | ---- | --------------------------------------- |
| `/`                       | GET  | API status and platform information     |
| `/scan`                   | POST | Run a security assessment               |
| `/scan/async`             | POST | Start an asynchronous scan              |
| `/scan/status/{job_id}`   | GET  | Check scan job status                   |
| `/assets`                 | GET  | Retrieve discovered assets              |
| `/vulnerability`          | GET  | Retrieve vulnerabilities                |
| `/risk`                   | GET  | Perform risk analysis                   |
| `/recommendation`         | GET  | Retrieve remediation recommendations    |
| `/history`                | GET  | Retrieve scan history                   |
| `/history/latest`         | GET  | Retrieve the latest scan                |
| `/dashboard/stats`        | GET  | Retrieve dashboard statistics           |
| `/reports/executive`      | GET  | Generate executive report data          |
| `/reports/export/pdf`     | GET  | Export a PDF report                     |
| `/reports/export/csv`     | GET  | Export a CSV report                     |
| `/auth/register`          | POST | Register a user                         |
| `/auth/login`             | POST | Authenticate a user                     |
| `/auth/me`                | GET  | Retrieve authenticated user information |
| `/chat`                   | POST | Security chat endpoint                  |
| `/assistant/chat`         | POST | Evidence-grounded security assistant    |

---

# Running a Security Assessment

## Demo Mode

Example request:

```
POST /scan?target=192.168.1.12&mode=demo

```

Demo mode can be used for demonstrations and environments where live network scanning is not available.

---

## Authorized Live Scan

Example request:

```
POST /scan?target=192.168.1.12&mode=live&authorized=true

```

Live scanning should only be performed against authorized systems.

The assessment pipeline performs:

```
1. Network Discovery
2. Asset Classification
3. Vulnerability Detection
4. Threat Intelligence Enrichment
5. Vulnerability Prioritization
6. Risk Analysis
7. Scan Storage
8. Dashboard and Report Generation

```

---

# Example Risk Output

A risk analysis may produce output similar to:

```
{
  "risk_score": 82.5,
  "risk_level": "High",
  "assets": [],
  "vulnerabilities": [],
  "prioritized_vulnerabilities": []
}

```

Actual values depend on the scanned environment and assessment results.

---

# Security and Authorization

Live scanning should only be performed against:

- Systems you own
- Systems you administer
- Environments where you have explicit permission
- Authorized laboratory or testing environments

The platform includes an authorization confirmation mechanism for live scans.

The application also supports:

- Password hashing
- JWT-based authentication
- User authentication
- Authenticated user profiles

Before a production deployment, the following should be reviewed:

- Change default secrets
- Use secure secret management
- Restrict CORS policies
- Secure database access
- Use HTTPS
- Disable demonstration fallbacks where inappropriate
- Review authentication and authorization policies

---

# Limitations

Security Assistance is designed as a security assessment and decision-support platform.

The following limitations should be considered:

- Version matching may indicate a potential vulnerability but does not prove exploitation.
- Detection of a service does not automatically mean that a system is compromised.
- EPSS is an exploitation probability estimate and does not guarantee exploitation.
- CVSS measures technical severity but does not represent complete business risk.
- Local threat-intelligence information may become outdated.
- Automated remediation recommendations should be reviewed before execution.
- Live scanning must only be performed with proper authorization.
- Production deployments require additional security hardening.

---

# Future Enhancements

Potential future improvements include:

- Real-time threat-intelligence APIs
- Updated CVE and EPSS feeds
- Enhanced role-based access control
- Automated vulnerability validation
- Cloud asset discovery
- Container and Kubernetes scanning
- SIEM integration
- Email and Slack alerts
- Scheduled scans
- WebSocket-based real-time scan progress
- Advanced asset relationship mapping
- Machine-learning-based risk prediction
- Production-grade audit logging
- Role-based dashboard customization

---

# Project Objective

The objective of Security Assistance is to transform raw network and vulnerability data into actionable security intelligence.

Instead of only answering:

> What vulnerabilities exist?

The platform is designed to help answer:

> Which vulnerabilities matter most?

> Which assets are most exposed?

> How likely is exploitation?

> What should be fixed first?

> How quickly should it be remediated?

---

# Disclaimer

This project is intended for educational, research, demonstration, and authorized security assessment purposes.

Users are responsible for ensuring that all scanning and testing activities are performed only on systems for which they have explicit authorization.

Unauthorized scanning or testing may be illegal and unethical.

---

# Security Assistance

**Discover. Analyze. Prioritize. Remediate.**

Security Assistance transforms network scan data into meaningful security intelligence and actionable remediation priorities.