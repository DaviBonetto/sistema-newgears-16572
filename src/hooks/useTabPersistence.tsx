import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface TabState {
  [pathname: string]: string;
}

/**
 * Hook para persistir o estado das abas por página
 * Salva automaticamente no localStorage quando a aba muda
 */
export function useTabPersistence(defaultTab: string) {
  const location = useLocation();
  const storageKey = `tab-state-${location.pathname}`;
  
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved || defaultTab;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, activeTab);
  }, [activeTab, storageKey]);

  return [activeTab, setActiveTab] as const;
}
