import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Business } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

/**
 * Checks if a business has an active premium subscription.
 */
export function isBusinessPremium(business: Business | null | undefined): boolean {
  if (!business || !business.isPaid || !business.premiumUntil || business.premiumStatus !== 'active') return false;
  
  const expiryDate = new Date(business.premiumUntil);
  const now = new Date();
  
  return expiryDate > now;
}

/**
 * Checks if a shop is currently open based on set hours.
 */
export function isShopOpen(business: Business | null | undefined): boolean {
  if (!business || !business.openingTime || !business.closingTime) return true; // Default to open if not set

  const now = new Date();
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTimeInMins = currentHour * 60 + currentMin;

  const [openH, openM] = business.openingTime.split(':').map(Number);
  const [closeH, closeM] = business.closingTime.split(':').map(Number);

  const openTimeInMins = openH * 60 + openM;
  const closeTimeInMins = closeH * 60 + closeM;

  return currentTimeInMins >= openTimeInMins && currentTimeInMins <= closeTimeInMins;
}

/**
 * Automatically compresses an image file to stay under a specific KB limit.
 * Uses Canvas API for client-side processing.
 */
export async function compressImage(file: File, maxSizeKB: number = 500): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimensions to keep file size reasonable
        const MAX_DIM = 1200;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Recursive quality reduction to hit the target size
        let quality = 0.8;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Approximate Base64 size check
        while ((dataUrl.length * 0.75) / 1024 > maxSizeKB && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
