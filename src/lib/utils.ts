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
