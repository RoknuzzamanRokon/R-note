"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopAppBar from "./TopAppBar";
import { SidebarProvider, useSidebar } from "./SidebarContext";

const NO_SHELL_ROUTES = ["/login"];

function ShellLayout({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar();

  return (
    <>
      <Sidebar />
      <TopAppBar />
      <main
        className="transition-all duration-300 pt-20 px-xl pb-xl"
        style={{ marginLeft: open ? "16rem" : "0" }}
      >
        {children}
      </main>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showShell = !NO_SHELL_ROUTES.includes(pathname);

  if (!showShell) return <>{children}</>;

  return (
    <SidebarProvider>
      <ShellLayout>{children}</ShellLayout>
    </SidebarProvider>
  );
}
