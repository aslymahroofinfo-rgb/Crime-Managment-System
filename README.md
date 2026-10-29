# Crime Investigation & Complaint Management System (CIW)

A modern, production-grade MERN (MongoDB, Express.js, React, Node.js) platform designed for lawful crime reporting, transparent citizen incident tracking, secure evidence management, and comprehensive administrative case investigation.

---

## 1. Technology Stack

- **Frontend**: React 19, React Router 7, Vite 8, Bootstrap 5, Preserved Original Custom CSS, Central API Services, Context API (AuthContext).
- **Backend**: Node.js (v20+ / v24+), Express.js 4, Mongoose 8, MongoDB.
- **Security & Utilities**:
  - JWT (JSON Web Tokens) with dynamic database verification
  - bcryptjs password hashing (salt rounds: 10)
  - Helmet security HTTP headers
  - express-rate-limit brute-force protection
  - Multer multipart/form-data evidence processing
  - Nodemailer non-blocking email notification infrastructure

---

## 2. Roles & Permissions (RBAC)

The system enforces strict Role-Based Access Control across three primary roles:

| Role | Description | Core Capabilities |
| :--- | :--- | :--- |
| **Citizen** | Authenticated public resident | Submit incident complaints, attach evidence (images/PDFs/videos), view personal dashboard, edit/delete pending complaints, track cases, update profile. |
| **Admin** | Station investigating officer | View all assigned complaints, review suspect/witness data, update case statuses (`Approved`, `Under Investigation`, `Resolved`, `Rejected`), manage contact inquiries, view system analytics & reports, soft-archive complaints. |
| **SuperAdmin** | Chief administrative authority | All Admin privileges plus: promote citizens to Admin, manage staff accounts, inspect system audit logs, access protected administrative controls. |

*Unauthenticated Guests* can view public information, submit inquiries via Contact Us, track complaints with valid credentials, and submit anonymous incident reports.

---

## 3. Core Features

- **Public Portal**: Responsive Landing page with dynamic incident statistics, About Us, Contact Us, Account Registration, Login, and Public Case Tracking.
- **Citizen Dashboard**: Case overview, detailed incident timelines, multi-file evidence upload gallery with secure streaming, self-service profile management, and pending incident draft editing/deletion.
- **Admin Control Panel**: Advanced complaint filtering (by category, district, status, search term), emergency complaint escalation feed, citizen directory with soft-deactivation, contact inquiries inbox, and interactive reports.
- **Traceability & Analytics**: Automated immutable status histories, actor logging, comprehensive audit trails with credential scrubbing, and real-time category/district breakdown charts.
- **Anonymous Reporting**: Architecture B implementation where anonymous complaints decoupled from public display and administrative scrutiny while maintaining secure private tracking for the submitter.

---

## 4. Security Hardening

- **Cryptographic JWT Secret**: Requires a minimum 32-character high-entropy secret; predictable secrets are strictly rejected on startup.
- **Live Dynamic Role Verification**: Auth middleware verifies live user state on every authenticated request, invalidating deactivated accounts and updating permissions immediately without requiring re-login.
- **Mass-Assignment Protection**: Public registration enforces `role = 'Citizen'`. Profile and complaint updates utilize strict allowlists, preventing privilege escalation and status tampering.
- **Protected Evidence Storage**: Direct HTTP access to `/uploads/` is forbidden (403). Files are streamed through an authenticated endpoint with ownership authorization, path traversal blocking, and MIME-type verification.
- **Physical Disk Cleanup**: Citizen deletion of pending drafts unlinks physical evidence from the server disk, preventing orphan file accumulation. Admin archival preserves evidence files on disk.
- **NoSQL Injection Defense**: Strict string coercion, parameterized queries, and Mongoose ObjectId validation prevent operator injection.
- **Centralized Error Handling**: Production environments suppress internal stack traces and database error diagnostics.

---

## 5. Prerequisites

- **Node.js**: v20.x or higher (tested on Node v24.13.1)
- **npm**: v10.x or higher
- **MongoDB**: MongoDB Community Server 7.x+ locally OR MongoDB Atlas Cloud Cluster

---

## 6. Installation & Setup

### Step 1: Clone Repository
```bash
git clone <repository_url>
cd "demo crime project - without react"
```

### Step 2: Install Dependencies
```bash
# Install root orchestration tools
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd client
npm install
cd ..
```

---

## 7. Environment Configuration

### Backend Configuration (`backend/.env`)
Copy the template and configure your environment variables:
```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `PORT` | Backend server port | `5000` |
| `USE_MOCK_DATA` | Enable development mock mode (`true` / `false`) | `true` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://localhost:27017/crime_complaint_db` |
| `JWT_SECRET` | 64-character high-entropy secret key | *Generate secure secret* |
| `CLIENT_URL` | Frontend URL for CORS whitelisting | `http://localhost:5174` |
| `SMTP_HOST` | (Optional) SMTP mail server host | `smtp.gmail.com` |
| `SMTP_PORT` | (Optional) SMTP port | `587` |
| `SMTP_USER` | (Optional) SMTP username | `your-email@gmail.com` |
| `SMTP_PASS` | (Optional) SMTP password / app key | `your-app-password` |
| `EMAIL_FROM` | (Optional) Outgoing sender email | `noreply@ciw-police.gov.lk` |

### Frontend Configuration (`client/.env`)
```bash
cp client/.env.example client/.env
```
Ensure `VITE_API_URL` points to your backend API:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 8. Running the Application

### Development (Concurrently running Backend + React Frontend):
From the project root:
```bash
npm run dev
```
- Backend runs at: `http://localhost:5000`
- React Client runs at: `http://localhost:5173` or `http://localhost:5174`

### Run Backend Only:
```bash
npm run dev:backend
```

### Run Frontend Only:
```bash
npm run dev:client
```

---

## 9. Mock Data Mode vs. MongoDB Mode

- **Development Mock Mode**: Set `USE_MOCK_DATA=true` in `backend/.env`. Allows full offline feature testing without an active database connection. Pre-seeded test accounts:
  - SuperAdmin: `admin@ccms.com` / `Admin@123`
  - Admin: `officer@ccms.com` / `Admin@123`
  - Citizen: `john@example.com` / `Password123`
  - Citizen: `alice@example.com` / `Password123`
- **Production Safety Rule**: Mock mode is **strictly prohibited** in production. If `NODE_ENV=production` and `USE_MOCK_DATA=true`, the backend server terminates on startup with exit code `1`.

---

## 10. Building for Production

To create an optimized production build of the React frontend:
```bash
npm run build
```
Output assets are generated in `client/dist/`.

---

## 11. Project Directory Structure

```text
├── backend/
│   ├── controllers/      # Route controllers (auth, complaints, users, etc.)
│   ├── middleware/       # JWT auth, RBAC, centralized error handling
│   ├── models/           # Mongoose schemas (User, Complaint, AuditLog, Contact)
│   ├── routes/           # Express API route definitions
│   ├── services/         # Audit logging, non-blocking email service
│   ├── uploads/          # Protected local evidence directory (.gitkeep)
│   ├── .env.example      # Backend environment template
│   └── server.js         # Backend entry point, security configuration
├── client/
│   ├── src/
│   │   ├── components/   # Navbar, Footer, Sidebar, PageTransition, StatusBadge
│   │   ├── context/      # AuthContext authentication state
│   │   ├── layouts/      # PublicLayout, AdminLayout
│   │   ├── pages/        # Public, Citizen, and Admin page views
│   │   ├── routes/       # ProtectedRoute, AdminRoute guards
│   │   ├── services/     # Axios API service clients
│   │   └── styles/       # Preserved original application styling
│   ├── .env.example      # Client environment template
│   └── vite.config.js    # Vite configuration
├── tests/
│   └── final_e2e.js      # Unified 21-test end-to-end integration suite
├── .gitignore            # Git exclusions
├── package.json          # Root scripts orchestration
└── README.md             # Project documentation
```

---

## 12. Automated Testing

Run the full end-to-end integration and security test suite:
```bash
npm test
```
The test suite verifies:
- Authentication & RBAC enforcement
- Citizen complaint creation & evidence lifecycle
- Evidence streaming security & directory traversal blocking
- Physical file cleanup on draft deletion vs. archival
- Admin status updates & status history timelines
- Soft-deactivation & dynamic token invalidation
- Public tracking privacy & sensitive data scrubbing
- API pagination & production client build health

