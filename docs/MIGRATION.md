# Project Migration & Structure Guide (LocalVyapar)

Aapne apna project safaltapoorvak taiyar kar liya hai. Ise apne computer par lene aur GitHub par dalne ke liye ye guide follow karein:

## Step 1: Code Download Karein
Firebase Studio mein "Download Project" icon par click karein. Ye icon usually screen ke **Top Right** mein hota hai (Arrow pointing down icon 📥).

## Step 2: Project Structure (Kaunsi file kya hai?)
Jab aap zip file kholenge, aapko ye main cheezein dikhengi:

- **`src/app/`**: Aapke app ke saare pages (Home, Login, Dashboard, Admin).
- **`src/components/`**: UI ke saare components (Buttons, Cards, Layouts).
- **`src/firebase/`**: Firebase setup aur database ke functions.
- **`src/ai/`**: Gemini AI ke flows (Audio intro, Product description).
- **`docs/`**: Deployment, GitHub, aur Migration guides.
- **`package.json`**: Saari libraries ki list (App run karne ke liye zaroori).
- **`firestore.rules`**: Database ki security settings.

## Step 3: Local Setup (Computer Par)
1. Zip file extract karein.
2. [Node.js](https://nodejs.org/) install karein (agar nahi hai).
3. Terminal mein `npm install` chalayein saari files download karne ke liye.
4. `.env.local` file banayein aur usme apni Firebase aur Gemini API keys dalein (Jo aapko Firebase Console se milengi).
5. `npm run dev` se app start karein.

## Step 4: GitHub par Push
Ab aap `docs/GITHUB_GUIDE.md` follow karke ise GitHub par upload kar sakte hain.

---
**Tip:** Download karne ke baad, saari files ko ek naye folder mein rakhein aur wahan se Git commands chalayein.
