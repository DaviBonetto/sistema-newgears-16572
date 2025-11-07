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
  lastPath: string | null;
  setLastPath: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [states, setStates] = useState<Record<string, NavigationState>>(() => {
    const saved = localStorage.getItem("navigation-states");
    return saved ? JSON.parse(saved) : {};
  });
  const [lastPath, setLastPathState] = useState<string | null>(() => {
    return localStorage.getItem("last-navigation-path");
  });

  useEffect(() => {
    localStorage.setItem("navigation-states", JSON.stringify(states));
  }, [states]);

  useEffect(() => {
    if (location.pathname !== "/auth" && location.pathname !== "/profile-setup") {
      localStorage.setItem("last-navigation-path", location.pathname);
      setLastPathState(location.pathname);
    }
  }, [location.pathname]);

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
    localStorage.removeItem("last-navigation-path");
    setLastPathState(null);
  };

  const setLastPath = (path: string) => {
    localStorage.setItem("last-navigation-path", path);
    setLastPathState(path);
  };

  return (
    <NavigationContext.Provider
      value={{ getPageState, setPageState, clearPageState, clearAllStates, lastPath, setLastPath }}
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
