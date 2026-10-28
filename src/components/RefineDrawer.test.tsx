import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RefineSection } from "./RefineDrawer";

afterEach(cleanup);

describe("section clearing", () => {
  it("resets only its own selection without toggling the dropdown", () => {
    const toggle = vi.fn();
    let selections = { category: ["Food", "Shopping"], booking: "required" };
    function Filters() {
      const [category, setCategory] = useState(selections.category);
      selections = { ...selections, category };
      return <RefineSection label="Category" open={false} onToggle={toggle}
        onClear={category.length > 0 ? () => setCategory([]) : undefined}>
        <span />
      </RefineSection>;
    }
    render(<Filters />);
    fireEvent.click(screen.getByRole("button", { name: "Clear Category" }));
    expect(selections.category).toEqual([]);
    expect(selections.booking).toBe("required");
    expect(toggle).not.toHaveBeenCalled();
  });
});