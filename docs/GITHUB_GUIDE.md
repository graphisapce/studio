# GitHub par Code Upload karne ki Guide 🚀

Agar aap pehli baar GitHub use kar rahe hain, toh ye steps follow karein:

## Step 1: GitHub Account aur Repository
1. [GitHub](https://github.com/) par jayein aur apna account banayein.
2. Top right mein `+` icon par click karke **New repository** select karein.
3. Repository name mein `local-vyapar` likhein.
4. Use **Public** ya **Private** rakhein (aapki marzi).
5. Niche **Create repository** button dabayein.
6. Ab aapko ek link dikhega (Jaise: `https://github.com/your-username/local-vyapar.git`). Ise copy kar lein.

## Step 2: Git Install Karein (PC Par)
Agar aapne Git install nahi kiya hai, toh [git-scm.com](https://git-scm.com/) se download karke install kar lein.

## Step 3: Code ko GitHub par bhejna
1. Apne computer par project folder ke andar jayein.
2. Khali jagah par Right Click karein aur **Open in Terminal** (ya Bash) select karein.
3. Niche di gayi commands ek-ek karke chalayein:

```bash
# 1. Git setup karein
git init

# 2. Saari files ko taiyar karein
git add .

# 3. Ek message likhein
git commit -m "My first delivery app"

# 4. Main branch set karein
git branch -M main

# 5. Apne GitHub link ko connect karein (Copy kiya hua link yahan paste karein)
git remote add origin https://github.com/your-username/local-vyapar.git

# 6. Code upload karein
git push -u origin main
```

## Step 4: Verification
Ab apna GitHub page refresh karein, aapka sara code wahan dikhne lagega! 🎉

---
**Tip:** Iske baad aap **Firebase Console** mein jakar **App Hosting** setup kar sakte hain.
