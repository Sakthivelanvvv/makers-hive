import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ErpShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="glass sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-3">
            <SidebarTrigger />
            <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders, products, vendors…" className="h-9 pl-8" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="rounded-md p-2 hover:bg-accent" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
