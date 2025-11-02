# Firebase Quick Start - Get Live in 15 Minutes!

Follow these steps to get your app live on Firebase for FREE.

## ⚡ Quick Steps

### 1. Create Firebase Project (3 min)
1. Go to https://console.firebase.google.com/
2. Click **Add project**
3. Name: `homeschool-tracker`
4. Disable Google Analytics (click Continue twice)
5. Wait for project creation
6. Click **Continue**

### 2. Get Firebase Config (2 min)
1. Click Web icon (`</>`) on project homepage
2. App nickname: `Homeschool Tracker`
3. Don't check Firebase Hosting yet
4. Click **Register app**
5. **Copy the configuration values** (keep tab open)

### 3. Add Config to .env (1 min)
1. Open `.env` file in project root
2. Replace the placeholder values with your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSyAb...                    # Your API key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

3. **Save the file**

### 4. Enable Authentication (2 min)
1. In Firebase Console → **Authentication**
2. Click **Get started**
3. Click **Email/Password**
4. Toggle **Enable** ON
5. Click **Save**

### 5. Enable Firestore (Optional, 2 min)
1. In Firebase Console → **Firestore Database**
2. Click **Create database**
3. Select **Test mode**
4. Choose location (e.g., us-central)
5. Click **Enable**

### 6. Test Locally (1 min)
```bash
npm run dev
```

Visit http://localhost:5173
- Click **Login** → **Sign up**
- Create account
- Test the app!

### 7. Deploy to Firebase (4 min)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select Hosting only)
firebase init hosting

# Select your project
# Public directory: dist
# Single-page app: Yes
# GitHub deploys: No

# Build and deploy
npm run build
firebase deploy
```

**Done!** Your app is live at:
`https://your-project.web.app`

---

## 📋 Checklist

- [ ] Created Firebase project
- [ ] Got Firebase configuration
- [ ] Updated .env file
- [ ] Enabled Email/Password authentication
- [ ] Enabled Firestore (optional)
- [ ] Tested locally
- [ ] Installed Firebase CLI
- [ ] Deployed to Firebase Hosting

---

## 🆘 Need Help?

See **FIREBASE_SETUP_GUIDE.md** for detailed instructions and troubleshooting.

---

## 💰 Cost

**FREE** - You won't exceed free tier limits for family use!

**What you get:**
- Frontend hosting (10 GB/month bandwidth)
- Authentication (unlimited users)
- Firestore database (50k reads/day, 20k writes/day)
- SSL certificate
- Global CDN
- Custom domain support

---

## 🔧 One-Line Deploy (After Setup)

```bash
npm run build && firebase deploy
```

That's it! Your changes are live in ~1 minute.
