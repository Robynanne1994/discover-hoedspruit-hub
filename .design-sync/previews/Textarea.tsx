import { Textarea, Label } from "vite_react_shadcn_ts";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 460 }}>
    {children}
  </div>
);

export const Empty = () => (
  <Wrap>
    <Label htmlFor="rev-empty">Write a review</Label>
    <Textarea id="rev-empty" placeholder="Write a review of this lodge…" rows={5} />
  </Wrap>
);

export const Filled = () => (
  <Wrap>
    <Label htmlFor="rev-filled">Your review</Label>
    <Textarea
      id="rev-filled"
      rows={5}
      defaultValue={
        "Stayed three nights over the long weekend and it was magic. Woke up to the Drakensberg turning gold and had bushbuck grazing right by the deck. The farm-to-table breakfast used citrus and macadamias from the neighbouring farms. Even had power straight through load-shedding thanks to their solar setup. We'll be back."
      }
    />
  </Wrap>
);

export const Disabled = () => (
  <Wrap>
    <Label htmlFor="rev-disabled">Reviews closed</Label>
    <Textarea
      id="rev-disabled"
      rows={4}
      disabled
      placeholder="Reviews open once your stay is complete."
    />
  </Wrap>
);
