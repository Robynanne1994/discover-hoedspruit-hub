import { useState } from "react";
import { SearchBar } from "vite_react_shadcn_ts";

export const Empty = () => {
  const [q, setQ] = useState("");
  return (
    <div style={{ padding: 24, maxWidth: 500, background: "#EDE6D6", borderRadius: 16 }}>
      <SearchBar
        value={q}
        onChange={setQ}
        placeholder="Search lodges, restaurants, events…"
      />
    </div>
  );
};

export const WithValue = () => {
  const [q, setQ] = useState("Blyde River Canyon");
  return (
    <div style={{ padding: 24, maxWidth: 500, background: "#EDE6D6", borderRadius: 16 }}>
      <SearchBar
        value={q}
        onChange={setQ}
        placeholder="Search lodges, restaurants, events…"
      />
    </div>
  );
};

export const CreamVariant = () => {
  const [q, setQ] = useState("");
  return (
    <div
      style={{
        padding: 24,
        maxWidth: 500,
        background: "#423324",
        borderRadius: 16,
      }}
    >
      <p style={{ margin: "0 0 12px", color: "#F3ECDD", fontSize: 15, fontWeight: 600 }}>
        Find your way around Hoedspruit
      </p>
      <SearchBar
        variant="cream"
        value={q}
        onChange={setQ}
        placeholder="Search the bushveld…"
      />
    </div>
  );
};
