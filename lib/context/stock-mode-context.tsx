'use client';

import { getCookie, setCookie } from '@/lib/utils/cookies';
import { createContext, useContext, useEffect, useState } from 'react';

// Define the context type
type StockModeContextType = {
  isStockModeEnabled: boolean;
  toggleStockMode: () => void;
  enableStockMode: () => void;
  disableStockMode: () => void;
};

// Create the context with a default value
const StockModeContext = createContext<StockModeContextType>({
  isStockModeEnabled: false,
  toggleStockMode: () => {},
  enableStockMode: () => {},
  disableStockMode: () => {},
});

// Hook to use the stock mode context
export const useStockMode = () => useContext(StockModeContext);

// Provider component
export function StockModeProvider({ children }: { children: React.ReactNode }) {
  const [isStockModeEnabled, setIsStockModeEnabled] = useState(false);

  // Initialize from cookie on mount
  useEffect(() => {
    const savedMode = getCookie('stock-mode');
    if (savedMode !== null) {
      setIsStockModeEnabled(savedMode === 'true');
    } else {
      // Default to false if cookie is not set
      setCookie('stock-mode', 'false');
    }
  }, []);

  // Update cookie whenever state changes
  useEffect(() => {
    setCookie('stock-mode', isStockModeEnabled.toString());
  }, [isStockModeEnabled]);

  const toggleStockMode = () => {
    setIsStockModeEnabled((prev) => !prev);
  };

  const enableStockMode = () => {
    setIsStockModeEnabled(true);
  };

  const disableStockMode = () => {
    setIsStockModeEnabled(false);
  };

  return (
    <StockModeContext.Provider
      value={{
        isStockModeEnabled,
        toggleStockMode,
        enableStockMode,
        disableStockMode,
      }}
    >
      {children}
    </StockModeContext.Provider>
  );
} 