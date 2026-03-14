#!/bin/bash
# ============================================================
#  Tournament Hub — Git Setup Script
#  Run once to push your project to GitHub.
#  Usage:  bash setup-git.sh
# ============================================================

echo ""
echo "🏆  Tournament Hub — Git Setup"
echo "================================"
echo ""

# Check git is installed
if ! command -v git &> /dev/null; then
  echo "❌  Git not found. Download from https://git-scm.com and try again."
  exit 1
fi

# Ask for GitHub username
read -p "Your GitHub username: " GH_USER
if [ -z "$GH_USER" ]; then
  echo "❌  Username cannot be empty"; exit 1
fi

# Ask for repo name
read -p "GitHub repo name (press Enter for 'tournament-hub'): " REPO_NAME
REPO_NAME=${REPO_NAME:-tournament-hub}

echo ""
echo "📦  Initializing git..."
git init
git add .
git commit -m "🏆 Initial commit: Tournament Hub MERN App"

echo ""
echo "🔗  Connecting to GitHub..."
git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git" 2>/dev/null || \
  git remote set-url origin "https://github.com/$GH_USER/$REPO_NAME.git"
git branch -M main

echo ""
echo "🚀  Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅  SUCCESS!"
  echo "   Your code is live at: https://github.com/$GH_USER/$REPO_NAME"
  echo ""
  echo "📋  Next steps:"
  echo "   1.  cp .env.example .env    ← then fill in your API keys"
  echo "   2.  npm run install-all     ← install all packages"
  echo "   3.  npm run dev             ← start the app"
  echo "   4.  Open http://localhost:3000"
else
  echo ""
  echo "❌  Push failed. Common reasons:"
  echo "   • Repo '$REPO_NAME' does not exist on GitHub yet."
  echo "     → Go to github.com → New repository → name it '$REPO_NAME' → Create (empty)"
  echo "   • Wrong username or password."
  echo "     → For password use a Personal Access Token:"
  echo "       GitHub → Settings → Developer Settings → Personal access tokens → Generate → tick 'repo'"
fi
