import { Checkbox, Label } from "vite_react_shadcn_ts";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 460 }}>
    {children}
  </div>
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{children}</div>
);

export const States = () => (
  <Wrap>
    <Row>
      <Checkbox id="c-default" />
      <span style={{ fontSize: 14 }}>Unchecked</span>
    </Row>
    <Row>
      <Checkbox id="c-checked" defaultChecked />
      <span style={{ fontSize: 14 }}>Checked</span>
    </Row>
    <Row>
      <Checkbox id="c-disabled" disabled />
      <span style={{ fontSize: 14, opacity: 0.5 }}>Disabled</span>
    </Row>
    <Row>
      <Checkbox id="c-disabled-checked" disabled defaultChecked />
      <span style={{ fontSize: 14, opacity: 0.5 }}>Disabled &amp; checked</span>
    </Row>
  </Wrap>
);

export const WithLabel = () => (
  <Wrap>
    <Row>
      <Checkbox id="events" defaultChecked />
      <Label htmlFor="events">Email me about events</Label>
    </Row>
    <Row>
      <Checkbox id="newsletter" />
      <Label htmlFor="newsletter">Subscribe to the weekly newsletter</Label>
    </Row>
  </Wrap>
);

export const NotifyPreferences = () => (
  <Wrap>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Notify me about</p>
    <Row>
      <Checkbox id="p-market" defaultChecked />
      <span style={{ fontSize: 14 }}>Saturday farmers market</span>
    </Row>
    <Row>
      <Checkbox id="p-loadshedding" defaultChecked />
      <span style={{ fontSize: 14 }}>Load-shedding schedule changes</span>
    </Row>
    <Row>
      <Checkbox id="p-lodges" />
      <span style={{ fontSize: 14 }}>New lodge &amp; guesthouse listings</span>
    </Row>
    <Row>
      <Checkbox id="p-roadworks" />
      <span style={{ fontSize: 14 }}>R40 / R527 roadwork alerts</span>
    </Row>
  </Wrap>
);
