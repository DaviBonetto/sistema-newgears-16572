import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

interface ScrollState {
  [key: string]: number;
}

/**
 * Hook para persistir a posição do scroll por página e aba
 * Restaura automaticamente quando o usuário volta à mesma página/aba
 */
export function useScrollPersistence(tabId?: string) {
  const location = useLocation();
  const scrollKey = tabId 
    ? `scroll-${location.pathname}-${tabId}`
    : `scroll-${location.pathname}`;
  
  const isRestoringRef = useRef(false);

  useEffect(() => {
    // Restaurar posição do scroll
    const savedPosition = localStorage.getItem(scrollKey);
    if (savedPosition && !isRestoringRef.current) {
      isRestoringRef.current = true;
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(savedPosition));
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      });
    }

    // Salvar posição do scroll periodicamente
    const handleScroll = () => {
      if (!isRestoringRef.current) {
        localStorage.setItem(scrollKey, window.scrollY.toString());
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      // Salvar ao sair da página
      if (!isRestoringRef.current) {
        localStorage.setItem(scrollKey, window.scrollY.toString());
      }
    };
  }, [scrollKey]);
}
