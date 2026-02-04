# LocalVyapar Deployment Guide

Aapne apna app LocalVyapar tayyar kar liya hai! Ab ise live karne ke liye niche diye gaye steps follow karein.

## Step 1: GitHub par Code Push karein
Sabse pehle apne is project ko GitHub par ek nayi repository mein upload karein.

## Step 2: Firebase App Hosting Setup
1. [Firebase Console](https://console.firebase.google.com/) par jayein.
2. Apna project select karein.
3. Left menu mein **Build** ke andar **App Hosting** par click karein.
4. **Get Started** par click karein.
5. Apne GitHub account ko connect karein aur wahi repository select karein jo aapne Step 1 mein banayi hai.
6. Deployment settings ko default rehne dein aur **Finish** par click karein.

## Step 3: Environment Variables
Agar aapne `.env.local` mein koi API keys rakhi hain (jaise `GOOGLE_GENAI_API_KEY`), to unhe Firebase Console mein App Hosting ki settings mein **Environment Variables** tab mein add karein.

## Step 4: Live URL
Ek baar deployment khatam hone ke baad, Firebase aapko ek `web.app` wala link dega jahan aapki website poori duniya ke liye live hogi!

---
**Tip:** Har baar jab aap GitHub par naya code push karenge, Firebase apne aap use build aur deploy kar dega.
