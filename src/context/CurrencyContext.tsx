import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'PKR' | 'USD' | 'GBP' | 'EUR' | 'CAD' | 'AED';

export interface CurrencyDetails {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateAgainstUsd: number; // 1 USD = rate
  format: (amountUsd: number, directPkr?: number) => string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyDetails> = {
  PKR: {
    code: 'PKR',
    symbol: 'Rs.',
    name: 'Pakistani Rupee',
    rateAgainstUsd: 277.55,
    format: (amountUsd, directPkr) => {
      const val = directPkr !== undefined ? directPkr : amountUsd * 277.55;
      return `Rs.${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PKR`;
    }
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rateAgainstUsd: 1.0,
    format: (amountUsd) => {
      return `$${amountUsd.toFixed(2)} USD`;
    }
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rateAgainstUsd: 0.78,
    format: (amountUsd) => {
      return `£${(amountUsd * 0.78).toFixed(2)} GBP`;
    }
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rateAgainstUsd: 0.92,
    format: (amountUsd) => {
      return `€${(amountUsd * 0.92).toFixed(2)} EUR`;
    }
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    rateAgainstUsd: 1.38,
    format: (amountUsd) => {
      return `CA$${(amountUsd * 1.38).toFixed(2)} CAD`;
    }
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    rateAgainstUsd: 3.67,
    format: (amountUsd) => {
      const val = amountUsd * 3.67;
      return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED`;
    }
  }
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (usdPrice: number, pkrPrice?: number) => string;
  getRawPrice: (usdPrice: number, pkrPrice?: number) => number;
  currentCurrencyDetails: CurrencyDetails;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to AED for UAE Dubai store
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fj_currency') as CurrencyCode;
      if (saved && CURRENCIES[saved]) return saved;
    }
    return 'AED';
  });

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fj_currency', code);
    }
  };

  const currentCurrencyDetails = CURRENCIES[currency];

  const formatPrice = (usdPrice: number, pkrPrice?: number) => {
    return currentCurrencyDetails.format(usdPrice, pkrPrice);
  };

  const getRawPrice = (usdPrice: number, pkrPrice?: number) => {
    if (currency === 'PKR') {
      return pkrPrice !== undefined ? pkrPrice : usdPrice * 277.55;
    }
    return usdPrice * currentCurrencyDetails.rateAgainstUsd;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        getRawPrice,
        currentCurrencyDetails
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
