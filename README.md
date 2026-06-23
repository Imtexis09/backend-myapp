# SafeScore QR - Backend API 🚀

This repository houses the backend system for **SafeScore QR**, a commercial hygienic compliance monitoring platform aligned with Mexico's official standard, **NOM-251**. The system enables business merchants to perform health self-assessments, generates real-time status QR codes, and empowers citizens to view hygiene track records and report sanitary violations in real-time.

The project is designed under a **RESTful architecture**, built using **Node.js** and **Express**, and deployed to the cloud via **Railway** with persistent data storage utilizing **SQLite**.

---

## 🛠️ Tech Stack

* **Runtime Environment:** Node.js (v22+)
* **Web Framework:** Express.js
* **Database:** SQLite3 (Configured with cloud-native persistent storage volumes)
* **Authentication & Security:** JSON Web Tokens (JWT) & Bcrypt hashing
* **Automation:** Independent Cloud Cron Jobs (scheduled to execute every 15 minutes)
* **Deployment & CI/CD:** Railway CLI & GitHub Actions

---

## 🎯 Key Features

1. **Authentication & Security (RBAC):** Secure Role-Based Access Control (Merchant / Consumer roles) encrypted and managed via stateless JWT tokens.
2. **NOM-251 Evaluation Engine:** A backend rules engine that processes establishment questionnaires, evaluates compliance metrics, and scores initial Hygiene Scores.
3. **QR Generation & Dynamic Parsing:** Optimized workflow designed to parse dynamic QR code URLs and instantly stream business metadata to the mobile frontend.
4. **Cascading Citizen Reporting System:** Upon receiving a public health complaint, the backend synchronously recalculates the establishment's Hygiene Score and instantly intercepts status transitions, triggering an immediate shift to an "Orange Alert" state if necessary.
5. **Automated Audit Cron Jobs:** Cloud-scheduled tasks that awaken every 15 minutes to autonomously degrade scores, audit alert validity times, and update the live status matrix without human intervention.

---

## 🗺️ API Endpoint Architecture

### Consumer Routes (`/api`)

| Method | Endpoint | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/scan` | Processes the scanned QR string data and extracts the Business ID. | Public |
| `GET` | `/api/business/:id` | Fetches the business profile, alert status, and incident logs. | Public |
| `POST` | `/api/business/:id/report` | Submits a health violation report (Supports anonymous submission). | Optional |
| `GET` | `/api/reports/history` | Retrieves the entire history of reports submitted by the authenticated client. | **Required (JWT)** |

---

## 🚀 Local Installation & Configuration

Follow these steps to clone and run the server locally within your development environment:

### 1. Clone the Repository
```bash
git clone [https://github.com/Imtexis09/SafeScoreQR-Backend.git](https://github.com/Imtexis09/SafeScoreQR-Backend.git)
cd SafeScoreQR-Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory of the project and define the following variables:
```env
PORT=3000
JWT_SECRET=your_super_secure_secret_passphrase
NODE_ENV=development
```

### 4. Run the Local Server
The server will boot up at `http://localhost:3000` with automated hot-reloading enabled via nodemon:
```bash
npm run dev
```

---

## ☁️ Production Deployment (Railway)

This backend is pre-configured for a seamless deployment on Railway. Due to the architecture of running SQLite on Linux containerized instances, the `package.json` includes custom automated native compilation scripts:

```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js",
  "install": "npm rebuild sqlite3 --build-from-source"
}
```

### Steps to Update Production:

1. **Environment Variables:** Ensure you duplicate your `.env` structure over into the Railway Dashboard Variables panel.
2. **Persistent Volumes:** Bind a persistent `Volume` to your deployment container, mounting it to the directory containing your `.sqlite3` file to guarantee data retention across container restarts.
3. **Deploy via Git:** Push directly to your production tracking branch:
```bash
git add .
git commit -m "feat: infrastructure ready for production"
git push origin main
```
Railway will automatically detect the webhook event, pull down the changes, trigger the custom build instructions, and optimize resources on the fly.


