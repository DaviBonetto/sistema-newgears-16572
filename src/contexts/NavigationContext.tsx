import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface NavigationState {
  currentTab: string;
  scrollPosition: number;
  lastVisited: number;
}

interface NavigationContextType {
  getPageState: (pathname: string) => NavigationState | null;
  setPageState: (pathname: string, state: Partial<NavigationState>) => void;
  clearPageState: (pathname: string) => void;
  clearAllStates: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [states, setStates] = useState<Record<string, NavigationState>>(() => {
    const saved = localStorage.getItem("navigation-states");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("navigation-states", JSON.stringify(states));
  }, [states]);

  const getPageState = (pathname: string) => {
    return states[pathname] || null;
  };

  const setPageState = (pathname: string, state: Partial<NavigationState>) => {
    setStates((prev) => ({
      ...prev,
      [pathname]: {
        ...prev[pathname],
        ...state,
        lastVisited: Date.now(),
      },
    }));
  };

  const clearPageState = (pathname: string) => {
    setStates((prev) => {
      const newStates = { ...prev };
      delete newStates[pathname];
      return newStates;
    });
  };

  const clearAllStates = () => {
    setStates({});
    localStorage.removeItem("navigation-states");
  };

  return (
    <NavigationContext.Provider
      value={{ getPageState, setPageState, clearPageState, clearAllStates }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}
