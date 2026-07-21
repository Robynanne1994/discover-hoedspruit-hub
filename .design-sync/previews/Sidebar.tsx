import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator,
} from "vite_react_shadcn_ts";
import { Home, Compass, CalendarDays, Heart, User, Mountain } from "lucide-react";

const nav = [
  { label: "Home", icon: Home, active: true },
  { label: "Explore", icon: Compass, active: false },
  { label: "Events", icon: CalendarDays, active: false },
  { label: "Saved", icon: Heart, active: false },
  { label: "Profile", icon: User, active: false },
];

export const AppNav = () => (
  <div style={{ height: 500, width: 300, overflow: "hidden", borderRadius: 12, border: "1px solid hsl(var(--border))" }}>
    <SidebarProvider defaultOpen style={{ minHeight: "100%", height: "100%" }}>
      <Sidebar collapsible="none" style={{ height: "100%" }}>
        <SidebarHeader>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: "hsl(var(--sidebar-primary))", color: "hsl(var(--sidebar-primary-foreground))" }}>
              <Mountain style={{ width: 18, height: 18 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Hello Hoedspruit</span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>Bushveld guide</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Browse</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton isActive={item.active}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "hsl(var(--sidebar-accent))" }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Robyn M.</span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>Local explorer</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  </div>
);
