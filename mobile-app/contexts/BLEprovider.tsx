import { createContext, useContext, ReactNode } from 'react';
import useBLE from '@/lib/useBLE';

const BLEContext = createContext<ReturnType<typeof useBLE> | null>(null);

export function BLEProvider({ children }: { children: ReactNode }) {
  const ble = useBLE();
  return <BLEContext.Provider value={ble}>{children}</BLEContext.Provider>;
}

export function useBLEContext() {
  const context = useContext(BLEContext);
  if (!context) throw new Error('useBLEContext must be used within BLEProvider');
  return context;
}