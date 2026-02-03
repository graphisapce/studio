# Project Migration Guide (LocalVyapar)

Aapne apna project safaltapoorvak taiyar kar liya hai. Ise naye editor (Antigravity/VS Code) mein le jaane ke liye niche diye gaye steps follow karein:

## Step 1: Code Download Karein
Saare files ko ek folder mein download karein. Isme `src`, `public`, `package.json`, `tsconfig.json`, aur `next.config.ts` jaise mukhya folders honge.

## Step 2: Firebase Setup
1. [Firebase Console](https://console.firebase.google.com/) par jayein.
2. **Authentication** enable karein (Email/Password aur Google providers).
3. **Cloud Firestore** database banayein.
4. Project Settings mein jakar "Web App" add karein aur configuration keys copy karein.

## Step 3: Environment Variables
Naye project ke root mein `.env.local` file banayein aur ye values bharon:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 4: Firestore Rules
Project mein maujood `firestore.rules` ke code ko Firebase Console ke "Rules" tab mein paste karke publish karein.

## Step 5: Install aur Run
Terminal khol kar ye commands chalayein:
1. `npm install` (Saari libraries install karne ke liye)
2. `npm run dev` (Project start karne ke liye)

---
**Note:** Dashboard ka option tabhi dikhega jab aap login karenge aur aapka role 'business' hoga. Role sync hone mein 1-2 second lag sakte hain.
