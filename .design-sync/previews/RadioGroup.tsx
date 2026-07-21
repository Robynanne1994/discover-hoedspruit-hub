import { RadioGroup, RadioGroupItem, Label } from "vite_react_shadcn_ts";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 460 }}>
    {children}
  </div>
);

const Item = ({ value, label }: { value: string; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <RadioGroupItem value={value} id={value} />
    <Label htmlFor={value}>{label}</Label>
  </div>
);

export const AccommodationType = () => (
  <Wrap>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Accommodation type</p>
    <RadioGroup defaultValue="lodge">
      <Item value="lodge" label="Safari lodge" />
      <Item value="guesthouse" label="Guesthouse" />
      <Item value="selfcatering" label="Self-catering" />
      <Item value="camping" label="Camping" />
    </RadioGroup>
  </Wrap>
);

export const SortBy = () => (
  <Wrap>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Sort listings by</p>
    <RadioGroup defaultValue="rating">
      <Item value="rating" label="Highest rated" />
      <Item value="price-low" label="Price: low to high" />
      <Item value="distance" label="Closest to town" />
    </RadioGroup>
  </Wrap>
);

export const WithDisabled = () => (
  <Wrap>
    <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Game drive time</p>
    <RadioGroup defaultValue="sunrise">
      <Item value="sunrise" label="Sunrise drive" />
      <Item value="afternoon" label="Afternoon drive" />
      <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.5 }}>
        <RadioGroupItem value="night" id="night" disabled />
        <Label htmlFor="night">Night drive (fully booked)</Label>
      </div>
    </RadioGroup>
  </Wrap>
);
