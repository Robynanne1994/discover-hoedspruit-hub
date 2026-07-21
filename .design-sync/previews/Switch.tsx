import { Switch, Label } from "vite_react_shadcn_ts";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 460 }}>
    {children}
  </div>
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{children}</div>
);

export const States = () => (
  <Wrap>
    <Row>
      <Switch id="s-off" />
      <span style={{ fontSize: 14 }}>Off</span>
    </Row>
    <Row>
      <Switch id="s-on" defaultChecked />
      <span style={{ fontSize: 14 }}>On</span>
    </Row>
    <Row>
      <Switch id="s-disabled" disabled />
      <span style={{ fontSize: 14, opacity: 0.5 }}>Disabled</span>
    </Row>
    <Row>
      <Switch id="s-disabled-on" disabled defaultChecked />
      <span style={{ fontSize: 14, opacity: 0.5 }}>Disabled &amp; on</span>
    </Row>
  </Wrap>
);

export const AlertSettings = () => (
  <Wrap>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <Label htmlFor="a-loadshedding">Load-shedding alerts</Label>
      <Switch id="a-loadshedding" defaultChecked />
    </div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <Label htmlFor="a-weather">Bushveld weather warnings</Label>
      <Switch id="a-weather" defaultChecked />
    </div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <Label htmlFor="a-market">Farmers market reminders</Label>
      <Switch id="a-market" />
    </div>
  </Wrap>
);
