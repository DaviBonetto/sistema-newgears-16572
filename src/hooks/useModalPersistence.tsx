import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface ModalState {
  isOpen: boolean;
  modalType: "create" | "edit" | "view" | null;
  itemId?: string;
  formData?: Record<string, any>;
}

/**
 * Hook para persistir o estado dos modais (abrir, editar, visualizar)
 * Restaura automaticamente quando o usuário volta à mesma página
 */
export function useModalPersistence(storageKey: string) {
  const location = useLocation();
  const fullKey = `modal-state-${location.pathname}-${storageKey}`;
  
  const [modalState, setModalState] = useState<ModalState>(() => {
    const saved = localStorage.getItem(fullKey);
    return saved ? JSON.parse(saved) : { isOpen: false, modalType: null };
  });

  useEffect(() => {
    localStorage.setItem(fullKey, JSON.stringify(modalState));
  }, [modalState, fullKey]);

  const openModal = (type: "create" | "edit" | "view", itemId?: string, formData?: Record<string, any>) => {
    setModalState({ isOpen: true, modalType: type, itemId, formData });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, modalType: null });
  };

  const updateFormData = (data: Record<string, any>) => {
    setModalState((prev) => ({ ...prev, formData: data }));
  };

  const clearModalState = () => {
    localStorage.removeItem(fullKey);
    setModalState({ isOpen: false, modalType: null });
  };

  return {
    modalState,
    openModal,
    closeModal,
    updateFormData,
    clearModalState,
  };
}
