"use client";

import { createContext, useContext, useState } from "react";

interface SidebarContextType {
  open: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  open: true,
  toggle: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const toggle = () => setOpen((v) => !v);
  return (
    <SidebarContext.Provider value={{ open, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}
