"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AssistantContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleAssistant: () => void;
  openAssistant: (query?: string) => void;
  closeAssistant: () => void;
  initialQuery?: string;
}

const AssistantContext = createContext<AssistantContextType>({
  isOpen: false,
  setIsOpen: () => {},
  toggleAssistant: () => {},
  openAssistant: () => {},
  closeAssistant: () => {},
});

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState<string | undefined>(undefined);

  const toggleAssistant = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openAssistant = useCallback((query?: string) => {
    if (query) setInitialQuery(query);
    setIsOpen(true);
  }, []);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Global event listener so any button or link across the site can trigger it
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ query?: string }>;
      openAssistant(customEvent.detail?.query);
    };
    const handleToggle = () => toggleAssistant();
    const handleClose = () => closeAssistant();

    window.addEventListener("rcy:open-assistant", handleOpen);
    window.addEventListener("rcy:toggle-assistant", handleToggle);
    window.addEventListener("rcy:close-assistant", handleClose);

    return () => {
      window.removeEventListener("rcy:open-assistant", handleOpen);
      window.removeEventListener("rcy:toggle-assistant", handleToggle);
      window.removeEventListener("rcy:close-assistant", handleClose);
    };
  }, [openAssistant, toggleAssistant, closeAssistant]);

  return (
    <AssistantContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleAssistant,
        openAssistant,
        closeAssistant,
        initialQuery,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  return useContext(AssistantContext);
}
