import {
  Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem,
  MenubarSeparator, MenubarLabel, MenubarShortcut,
} from "vite_react_shadcn_ts";

export const TownMenu = () => (
  <div style={{ padding: "24px 24px 260px" }}>
    <Menubar value="explore">
      <MenubarMenu value="explore">
        <MenubarTrigger>Explore</MenubarTrigger>
        <MenubarContent>
          <MenubarLabel>Around Hoedspruit</MenubarLabel>
          <MenubarSeparator />
          <MenubarItem>Safari lodges</MenubarItem>
          <MenubarItem>Restaurants &amp; cafés</MenubarItem>
          <MenubarItem>Blyde River Canyon</MenubarItem>
          <MenubarItem>
            Farmers markets <MenubarShortcut>New</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="events">
        <MenubarTrigger>Events</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>This weekend</MenubarItem>
          <MenubarItem>Load-shedding schedule</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="saved">
        <MenubarTrigger>Saved</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>My trip</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  </div>
);
