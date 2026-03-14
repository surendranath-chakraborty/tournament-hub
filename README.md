# 🏆 Tournament Hub

A full-stack **MERN** (MongoDB, Express, React, Node.js) web application for organizing and joining sports tournaments — with AI-powered fixture generation, Razorpay payments, smart waitlist management, and PDF/Excel exports.

---

## 📁 Project Structure

```
tournament-hub/
├── server/
│   ├── index.js                  ← Express entry point
│   ├── middleware/
│   │   └── auth.js               ← JWT protect / hostOnly / playerOnly
│   ├── models/
│   │   ├── User.js               ← User schema (host & player)
│   │   ├── Tournament.js         ← Tournament schema
│   │   └── Registration.js       ← Registration + payment schema
│   └── routes/
│       ├── auth.js               ← Register, login, profile
│       ├── tournaments.js        ← CRUD + host registrations
│       ├── registrations.js      ← Player register / withdraw
│       ├── payments.js           ← Razorpay create-order + verify
│       ├── ai.js                 ← Groq fixture + ground suggestion
│       └── users.js              ← Dashboard stats
├── client/
│   ├── public/
│   │   └── index.html            ← HTML with Razorpay script tag
│   └── src/
│       ├── App.js                ← Router + route guards
│       ├── index.js              ← React entry point
│       ├── index.css             ← Global styles (dark theme)
│       ├── context/
│       │   └── AuthContext.js    ← Global auth state + axios setup
│       ├── components/Shared/
│       │   ├── Navbar.js         ← Top navigation bar
│       │   └── TournamentCard.js ← Reusable tournament card
│       └── pages/
│           ├── Home.js           ← Landing page
│           ├── Login.js          ← Login form
│           ├── Register.js       ← Register with role picker
│           ├── Dashboard.js      ← Host & Player dashboards
│           ├── TournamentList.js ← Browse + filter tournaments
│           ├── TournamentDetail.js ← View + register for tournament
│           ├── CreateTournament.js ← 4-step create form (host)
│           ├── EditTournament.js ← Edit tournament (host)
│           ├── HostRegistrations.js ← Manage entries + export (host)
│           ├── MyRegistrations.js  ← Player's entries + withdraw
│           ├── AITools.js        ← Fixture generator + ground finder
│           └── Profile.js        ← Edit profile
├── .env.example                  ← Copy to .env and fill keys
├── .gitignore
├── package.json                  ← Root scripts
└── README.md
```

---

## 🚀 Quick Start

### Step 1 — Prerequisites

Install these first (one-time setup):

| Tool | Download |
|------|----------|
| Node.js (LTS) | https://nodejs.org |
| Git | https://git-scm.com |
| VS Code | https://code.visualstudio.com |

### Step 2 — Clone / Extract the project

If you downloaded the zip:
```bash
# Unzip the file, then open terminal inside the folder
cd tournament-hub
```

If cloning from GitHub:
```bash
git clone https://github.com/YOUR_USERNAME/tournament-hub.git
cd tournament-hub
```

### Step 3 — Create your .env file

```bash
cp .env.example .env
```

Open `.env` and fill in your keys (see section below for where to get them).

### Step 4 — Install all dependencies

```bash
npm run install-all
```

This installs packages for both the server and the React client.

### Step 5 — Start the app

```bash
npm run dev
```

- Backend runs on → http://localhost:5000
- Frontend runs on → http://localhost:3000

Open **http://localhost:3000** in your browser. 🎉

---

## 🔑 Getting Your Free API Keys

### MongoDB Atlas (Database)
1. Go to https://cloud.mongodb.com → Sign up free
2. Create a free **M0** cluster
3. Click **Connect** → **Drivers** → copy the connection string
4. Replace `<password>` with your real password
5. In **Network Access** → Add IP Address → **0.0.0.0/0** (allow all)

```
MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/tournamenthub
```

### Razorpay (Payments)
1. Go to https://razorpay.com → Sign up free
2. Dashboard → **Settings** → **API Keys** → **Generate Test Keys**
3. Copy Key ID and Key Secret

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### Groq AI (Free Fixture & Ground AI)
1. Go to https://console.groq.com → Sign up free
2. **API Keys** → **Create API Key** → Copy it

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### JWT Secret
Just make up any random string:
```
JWT_SECRET=myRandomSecretKey_ChangeThis123
```

---

## 📤 Push to GitHub

### Step 1: Create a repo on GitHub
1. Go to https://github.com → Click **New repository**
2. Name it `tournament-hub`
3. Leave it **empty** (no README, no .gitignore)
4. Click **Create repository**

### Step 2: Push your code
Open terminal in the `tournament-hub` folder and run:

```bash
git init
git add .
git commit -m "Initial commit: Tournament Hub MERN App"
git remote add origin https://github.com/YOUR_USERNAME/tournament-hub.git
git branch -M main
git push -u origin main
```

> When prompted for password, use a **Personal Access Token** (not your GitHub password):
> GitHub → Settings → Developer Settings → Personal access tokens → Generate new token → tick **repo** → copy it → paste as your password.

### Step 3: Future updates
Whenever you change code and want to save:
```bash
git add .
git commit -m "describe what you changed"
git push
```

---

## 🌐 Deploy Live for Free (Render.com)

1. Go to https://render.com → Sign up → **New Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Build Command:** `npm run install-all && npm run build`
   - **Start Command:** `npm start`
4. Add all your `.env` variables in Render's **Environment** tab
5. Add `NODE_ENV=production`
6. Deploy!

---

## 🧪 How to Test Everything

| Feature | Steps |
|---------|-------|
| **Host** | Register → pick Host role → Create Tournament (4 steps) |
| **View registrations** | Dashboard → click your tournament → 📋 Entries |
| **Export PDF/Excel** | Registrations page → PDF or Excel button |
| **Player** | Register another account → pick Player role |
| **Browse & Register** | Browse page → pick a tournament → Register Now |
| **Paid tournament** | If entry fee > 0 → Razorpay test card: `4111 1111 1111 1111` |
| **Waitlist** | Fill all slots → next player joins waitlist |
| **Withdraw** | My Registrations → Withdraw button |
| **AI Fixture** | AI Tools → type team names → Generate Fixture |
| **AI Grounds** | AI Tools → Ground Finder → enter city |
| **Edit Profile** | Profile page → change name/city/password |

---

## 🛠️ API Reference

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/profile` | ✅ | Update profile |
| GET | `/api/tournaments` | — | Browse (filter: sport, city, status, type) |
| GET | `/api/tournaments/:id` | — | Get tournament details |
| POST | `/api/tournaments` | Host | Create tournament |
| PUT | `/api/tournaments/:id` | Host | Update tournament |
| DELETE | `/api/tournaments/:id` | Host | Cancel tournament |
| GET | `/api/tournaments/:id/registrations` | Host | View all registrations |
| DELETE | `/api/tournaments/:id/registrations/:regId` | Host | Remove a player |
| POST | `/api/registrations` | Player | Register for tournament |
| GET | `/api/registrations/my` | Player | My registrations |
| PUT | `/api/registrations/:id` | Player | Edit registration details |
| DELETE | `/api/registrations/:id` | Player | Withdraw |
| POST | `/api/payments/create-order` | Player | Create Razorpay order |
| POST | `/api/payments/verify` | Player | Verify payment |
| POST | `/api/ai/fixture` | ✅ | AI generate bracket |
| POST | `/api/ai/grounds` | ✅ | AI suggest grounds |
| GET | `/api/users/stats` | ✅ | Dashboard stats |

---

## ❓ Troubleshooting

**`npm run install-all` fails**
→ Run `node --version` — needs v18+. Download from nodejs.org.

**MongoDB connection error**
→ Check MONGO_URI. Make sure you replaced `<password>`. Also whitelist IP 0.0.0.0/0 in Atlas Network Access.

**AI tools say "failed"**
→ Check GROQ_API_KEY in your `.env`. Get a free key at console.groq.com.

**Razorpay not working**
→ Use test card `4111 1111 1111 1111`, any future date, any CVV. Make sure keys are in `.env`.

**Git push asks for password**
→ Use a GitHub Personal Access Token as the password (not your GitHub account password). See Push to GitHub section above.

**Port 5000 already in use**
→ Change `PORT=5001` in `.env` and change `"proxy": "http://localhost:5001"` in `client/package.json`.

**White screen on browser**
→ Open browser console (F12) → look for error. Usually a missing `.env` variable.
