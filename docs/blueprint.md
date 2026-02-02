# **App Name**: LocalVyapar

## Core Features:

- Authentication: Secure user authentication via Firebase Auth with phone number (OTP) or email/password fallback, with user role selection ('Customer' or 'Business Owner') during signup.
- Shop Registration: Allow business owners to register their shop, including details like shop name, category, address, and contact information, stored in Firestore.
- Product Listing: Enable business owners to list products/services with details like title, price, description, and image, stored in Firestore.
- Hyperlocal Search: Implement a search functionality for buyers to find local businesses by name or category, filtering from the fetched Firestore data.
- Business Details View: Display shop details with a cover image, 'Call Now' and 'WhatsApp' buttons for direct contact, and a list of products/services.
- Responsive Layout: Adapt the UI based on the platform: Bottom Navigation Bar for mobile, Sidebar Navigation for Windows.
- Image Watermarking: Apply a 'Noor Creator' text overlay on uploaded images programmatically or via UI display.

## Style Guidelines:

- Primary color: Cyan Blue (#00BCD4) for a clean and modern feel.
- Secondary color: Deep Navy Blue (#000080) for accents and emphasis.
- Background color: Solid White (#FFFFFF) for a clean and readable layout.
- Font recommendation: 'PT Sans' (sans-serif) for both body and headlines, due to its combination of a modern look and some warmth/personality.
- Use simple, modern icons to represent categories and actions.
- Responsive layout adapts to platform: Bottom Navigation Bar (mobile) / Sidebar Navigation (Windows).
- Subtle animations for transitions and loading states to improve user experience.