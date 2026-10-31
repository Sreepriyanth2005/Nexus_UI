# Nexus Learning Portal

The Nexus Learning Portal is a multi-tenant, enterprise-grade learning management system that provides structured course delivery, progress tracking, assessments, and certification. It supports corporate training through role-based access control, course workflows, and detailed reporting, ensuring secure and scalable learning experiences.

## Tech Stack

- Frontend: React + Vite + TypeScript
- Backend API: Node.js + Express + TypeScript
- Documentation: Swagger UI (OpenAPI 3)
- Serverless: Firebase Cloud Functions (Gen 2)

## Project Structure

```text
nexus/
  backend/
    src/                  # Express backend
    functions/            # Firebase Cloud Functions
  frontend/               # React frontend (Vite)
  firebase.json           # Firebase config (functions + emulators)
```

## Prerequisites

- Node.js 20+
- npm
- Firebase CLI (`npm install -g firebase-tools`) for Functions emulation/deploy

## Installation

From project root:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
npm install --prefix backend/functions
```

## Environment Setup

Update these files with your values:

- `backend/.env.development`
- `backend/.env.staging`
- `backend/.env.production`
- `frontend/.env.development`
- `frontend/.env.staging`
- `frontend/.env.production`

Also set your Firebase project id in `.firebaserc`:

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

## Run the Application

### Start frontend + backend + functions emulator

```bash
npm run dev
```

- Backend starts on `5000` or next free port.
- Frontend starts on Vite port (`5173` or next free port).
- Firebase Functions emulator starts on `5002` (UI on `4000`).

If you want only frontend + backend (without functions emulator):

```bash
npm run dev:app
```

### Build frontend + backend

```bash
npm run build
```

## Backend Swagger Docs

Once backend is running:

- Swagger UI: `http://localhost:<backend-port>/api-docs`
- OpenAPI JSON: `http://localhost:<backend-port>/api-docs.json`

Current documented endpoints:

- `GET /health`
- `POST /api/v1/auth/login`

## Firebase Functions (Serverless)

Functions code is in `backend/functions/src`.

Implemented samples:

- HTTPS function: `health`
- HTTPS function: `helloNexus`
- Firestore trigger: `onEmailCreated` for `emails/{emailId}`
- Firestore trigger: `onNotificationCreated` for `notifications/{notificationId}`

### Build Functions

```bash
npm run functions:build
```

### Run Functions Emulator

```bash
npm run functions:serve
```

When emulator starts, test sample HTTPS functions:

```bash
curl http://127.0.0.1:5002/<your-firebase-project-id>/us-central1/health
curl "http://127.0.0.1:5002/<your-firebase-project-id>/us-central1/helloNexus?tenant=acme"
```

### Deploy Functions

```bash
npm run functions:deploy
```

## Useful Scripts

From root `package.json`:

- `npm run dev` - Run backend + frontend + Firebase functions emulator
- `npm run dev:app` - Run only backend + frontend
- `npm run dev:backend` - Run only backend
- `npm run dev:frontend` - Run only frontend
- `npm run build` - Build backend + frontend
- `npm run functions:build` - Build Firebase functions
- `npm run functions:serve` - Start Firebase emulators for functions
- `npm run functions:deploy` - Deploy Firebase functions

## Note

- On some Windows PowerShell setups, use `npm.cmd` instead of `npm` if script execution is restricted.
- Keep real secrets only in secure env management (not committed to git).
- `backend/functions/package.json` pins runtime to Node `20` for Firebase deploy compatibility.
