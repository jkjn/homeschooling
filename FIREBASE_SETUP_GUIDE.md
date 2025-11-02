# Firebase Setup Guide - Quick Start

Complete setup guide for deploying your Homeschool Time Tracker with Firebase.

**Total Time: ~15 minutes**
**Total Cost: $0/month**

---

## Step 1: Create Firebase Project (3 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** (or **Create a project** if first time)
3. Enter project name: `homeschool-tracker` (or your choice)
4. Click **Continue**
5. Google Analytics: **Disable** (not needed) or enable if you want
6. Click **Create project**
7. Wait for project creation (~30 seconds)
8. Click **Continue**

---

## Step 2: Register Web App (2 minutes)

1. In your Firebase project dashboard, click the **Web icon** (`</>`)
2. App nickname: `Homeschool Tracker Web`
3. **Do NOT** check "Set up Firebase Hosting" (we'll do this later)
4. Click **Register app**
5. You'll see your Firebase configuration - **KEEP THIS OPEN**

---

## Step 3: Copy Firebase Configuration (1 minute)

You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAb..."
  authDomain: "homeschool-tracker-xyz.firebaseapp.com",
  projectId: "homeschool-tracker-xyz",
  storageBucket: "homeschool-tracker-xyz.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

**Create `.env` file:**

```bash
# In your project root
cp .env.example .env
```

**Edit `.env` and paste your values:**

```env
VITE_FIREBASE_API_KEY=AIzaSyAb...
VITE_FIREBASE_AUTH_DOMAIN=homeschool-tracker-xyz.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=homeschool-tracker-xyz
VITE_FIREBASE_STORAGE_BUCKET=homeschool-tracker-xyz.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**Save the file!**

---

## Step 4: Enable Authentication (2 minutes)

1. In Firebase Console sidebar, click **Authentication**
2. Click **Get started**
3. Click **Sign-in method** tab

### Enable Email/Password:
1. Click on **Email/Password**
2. Toggle **Enable** to ON
3. Click **Save**

### (Optional) Enable Google Sign-In:
1. Click on **Google**
2. Toggle **Enable** to ON
3. Select your email from dropdown
4. Click **Save**

### (Optional) Enable GitHub Sign-In:
1. You'll need to create a GitHub OAuth App first
2. Follow instructions in Firebase Console
3. (Skip for now if you don't need it)

---

## Step 5: Enable Firestore Database (2 minutes)

1. In Firebase Console sidebar, click **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we can secure it later)
4. Click **Next**
5. Select location: Choose closest to you (e.g., `us-central`)
6. Click **Enable**
7. Wait for database creation (~30 seconds)

---

## Step 6: Install Dependencies & Test Locally (2 minutes)

```bash
# Install Firebase
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 (or the port shown)

**Test Authentication:**
1. Click **Login** button in header
2. Click **Sign up** link
3. Create an account with your email
4. You should be logged in and redirected to dashboard!

---

## Step 7: Set Up Firebase CLI (3 minutes)

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# This will open your browser - sign in with your Google account

# Initialize Firebase in your project
firebase init
```

**Select features (use space to select, enter to confirm):**
- [x] Hosting
- [ ] Everything else (not needed yet)

**Configuration prompts:**
- Use existing project? **Yes**
- Select your project: **homeschool-tracker-xyz**
- Public directory: **dist**
- Single-page app: **Yes**
- GitHub auto-deploys: **No** (you can set this up later)

---

## Step 8: Deploy to Firebase Hosting (1 minute)

```bash
# Build your app
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

Wait for deployment (~30 seconds)

**Your app is now live!** 🎉

You'll see URLs like:
```
https://homeschool-tracker-xyz.web.app
https://homeschool-tracker-xyz.firebaseapp.com
```

Visit the URL and test your live app!

---

## Summary: What You Got (All FREE)

✅ **Frontend Hosting**: Firebase Hosting
✅ **Database**: Firestore
✅ **Authentication**: Email/Password + Google (optional)
✅ **SSL/HTTPS**: Automatic
✅ **Global CDN**: Included
✅ **Custom Domain**: Supported (optional)

**Monthly Cost**: $0 (stays free for family use)

---

## Quick Commands Reference

```bash
# Start local development
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy

# Deploy only hosting (faster)
firebase deploy --only hosting

# View Firebase project
firebase open

# View live site
firebase hosting:channel:open

# Check Firebase logs
firebase functions:log
```

---

## Next Steps (Optional)

### Add Custom Domain
1. Go to Firebase Console → Hosting
2. Click **Add custom domain**
3. Follow DNS setup instructions

### Secure Firestore Rules
1. Go to Firestore Database → Rules
2. Update with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Set Up GitHub Auto-Deploy
```bash
firebase init hosting:github
```

### Add More Features
- Add more auth providers (Twitter, Facebook, etc.)
- Enable Firestore for multi-device sync
- Add Cloud Functions for backend logic

---

## Troubleshooting

### Error: "Firebase: Error (auth/unauthorized-domain)"
**Solution:** Add your domain to authorized domains
1. Firebase Console → Authentication → Settings
2. Authorized domains → Add domain
3. Add: `localhost` and your deployment URL

### Error: "Module not found: firebase/app"
**Solution:** Install Firebase
```bash
npm install firebase
```

### Error: "Environment variables not defined"
**Solution:** Create `.env` file with your Firebase config

### Build fails
**Solution:** Check that all environment variables are set
```bash
# View .env file
cat .env
```

---

## Cost Monitoring

Firebase free tier limits (you won't exceed these):
- **Storage**: 10 GB
- **Bandwidth**: 360 MB/day
- **Firestore reads**: 50,000/day
- **Firestore writes**: 20,000/day

**Your usage:**
- Storage: ~10 MB (0.1% of limit)
- Bandwidth: ~5 MB/day (1.4% of limit)
- Reads: ~500/day (1% of limit)
- Writes: ~150/day (0.75% of limit)

**You'll stay FREE indefinitely** ✅

---

## Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
- [Firebase Discord](https://discord.gg/firebase)

---

## Complete! 🎉

Your app is now:
- ✅ Live on the internet
- ✅ Secured with authentication
- ✅ Backed by cloud database
- ✅ FREE to use
- ✅ Accessible from anywhere
- ✅ Mobile-friendly

**Share your app URL with your family and start tracking!**
