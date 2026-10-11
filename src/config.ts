/**
 * ICON ACTIVEWEAR - Central Store Configuration
 * 
 * To change or update the store owner / admin email, simply update
 * the `email` value below. All authentication checks, admin dropdowns,
 * and contact links across the entire store will automatically update!
 */
const getEnvVar = (key: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

const configuredEmail = getEnvVar('VITE_STORE_OWNER_EMAIL', getEnvVar('STORE_OWNER_EMAIL', 'nazneenrizvi1711@gmail.com'));
const configuredName = getEnvVar('VITE_STORE_OWNER_NAME', 'Nazneen (Store Owner)');
const configuredPhone = getEnvVar('VITE_STORE_OWNER_PHONE', '+971 50 123 4567');

export const STORE_OWNER_CONFIG = {
  email: configuredEmail,
  name: configuredName,
  whatsapp: configuredPhone.replace(/\s+/g, ''),
  whatsappDisplay: configuredPhone,
  supportEmail: configuredEmail,
  location: 'Dubai, United Arab Emirates',
  defaultCurrency: 'AED',
  freeShippingThresholdAed: 150
};

export const STORE_OWNER_EMAIL = STORE_OWNER_CONFIG.email;
