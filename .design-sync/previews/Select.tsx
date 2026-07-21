import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  SelectLabel, SelectGroup,
} from "vite_react_shadcn_ts";

export const AccommodationType = () => (
  <div style={{ padding: "24px 24px 240px", maxWidth: 300, margin: "0 auto" }}>
    <Select open defaultValue="lodge">
      <SelectTrigger>
        <SelectValue placeholder="Accommodation type" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Stay in Hoedspruit</SelectLabel>
          <SelectItem value="lodge">Safari lodge</SelectItem>
          <SelectItem value="guesthouse">Guesthouse</SelectItem>
          <SelectItem value="bushcamp">Bush camp</SelectItem>
          <SelectItem value="selfcatering">Self-catering</SelectItem>
          <SelectItem value="camping">Camping</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
);
