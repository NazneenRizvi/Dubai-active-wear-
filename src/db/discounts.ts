import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export interface DiscountSettings { code: string; percent: number; enabled: boolean }
const DEFAULT_DISCOUNT: DiscountSettings = { code: '', percent: 0, enabled: false };
function reference() {
  const account = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const app = getApps()[0] || initializeApp({ credential: account ? cert(JSON.parse(account)) : applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID || 'icone-active-wear-2' });
  return getFirestore(app).collection('store_settings').doc('discount');
}
export async function getDiscountSettings(): Promise<DiscountSettings> {
  const document = await reference().get();
  const data = document.data();
  if (!data || !/^[A-Z0-9_-]{4,24}$/.test(data.code) || !Number.isInteger(data.percent) || data.percent < 1 || data.percent > 40) return DEFAULT_DISCOUNT;
  return {code: data.code, percent: data.percent, enabled: data.enabled === true};
}
export async function saveDiscountSettings(value: DiscountSettings): Promise<DiscountSettings> {
  await reference().set(value);
  return value;
}
