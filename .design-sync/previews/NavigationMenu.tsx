import {
  NavigationMenu, NavigationMenuList, NavigationMenuItem,
  NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
} from "vite_react_shadcn_ts";

const link = {
  display: "block", padding: "10px 12px", borderRadius: 8,
  fontSize: 13, lineHeight: 1.3, textDecoration: "none", color: "inherit",
} as const;

export const TownNav = () => (
  <div style={{ padding: "24px 24px 260px", display: "flex", justifyContent: "center" }}>
    <NavigationMenu value="explore">
      <NavigationMenuList>
        <NavigationMenuItem value="explore">
          <NavigationMenuTrigger>Explore</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div style={{ display: "grid", gap: 4, padding: 12, width: 320 }}>
              <NavigationMenuLink style={link}>
                <strong>Safari lodges</strong>
                <div style={{ opacity: 0.6 }}>Big Five reserves &amp; bush camps</div>
              </NavigationMenuLink>
              <NavigationMenuLink style={link}>
                <strong>Blyde River Canyon</strong>
                <div style={{ opacity: 0.6 }}>Viewpoints &amp; hikes</div>
              </NavigationMenuLink>
              <NavigationMenuLink style={link}>
                <strong>Farmers markets</strong>
                <div style={{ opacity: 0.6 }}>Local produce every Saturday</div>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="events">
          <NavigationMenuTrigger>Events</NavigationMenuTrigger>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  </div>
);
