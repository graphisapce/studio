# Project Migration & Structure Guide (LocalVyapar)

Aapne apna project safaltapoorvak taiyar kar liya hai. Ise apne computer par lene aur GitHub par dalne ke liye ye guide follow karein:

## Step 1: Code Download Karein (UI Guide)
Firebase Studio mein **Gemini Chat** ke theek upar ek toolbar hai. Wahan char icons hain:
1. Refresh
2. Share
3. **Download (📥 Icon)** - Is par click karte hi aapki saari files ek ZIP file mein download ho jayengi.

## Step 2: Unzip aur Structure Check
Jab aap ZIP file kholenge, aapko ye folder milenge:
- **`src/`**: Saara logic aur components (Main code yahan hai).
- **`public/`**: Images aur icons.
- **`package.json`**: Dependencies ki list.
- **`docs/`**: GitHub (`GITHUB_GUIDE.md`) aur Deployment (`DEPLOYMENT.md`) ki guides.

## Step 3: GitHub par Push (Step-by-Step)
1. Ek naya folder banayein apne PC par.
2. ZIP file ka saara content us folder mein daal dein.
3. Terminal khol kar `docs/GITHUB_GUIDE.md` mein di gayi commands chalayein.

## Step 4: Live Run (Firebase App Hosting)
1. GitHub par code dalne ke baad, Firebase Console par jayein.
2. **App Hosting** select karein aur GitHub repo connect karein.
3. Environment variables mein Gemini API Key (`GOOGLE_GENAI_API_KEY`) add karein.

---
**Zaroori Tip:** ZIP download karne ke baad, use apne computer ke kisi safe folder mein rakhein. Aapka app ab bilkul stable hai!