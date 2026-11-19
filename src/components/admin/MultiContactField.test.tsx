import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import MultiContactField from "./MultiContactField";

afterEach(cleanup);

describe("MultiContactField removal", () => {
  it("removes an extra WhatsApp number and its matching label in one update", () => {
    let saved = { values: ["27833079258", "27735895924"], labels: ["", "Manager"] };

    function Contacts() {
      const [state, setState] = useState(saved);
      saved = state;
      return (
        <MultiContactField
          label="WhatsApp"
          primary="27655956966"
          onPrimaryChange={() => undefined}
          extras={state.values}
          onExtrasChange={(values, labels) => setState({
            ...state,
            values,
            ...(labels ? { labels } : {}),
          })}
          extraLabels={state.labels}
          onExtraLabelsChange={(labels) => setState({ ...state, labels })}
        />
      );
    }

    render(<Contacts />);
    fireEvent.click(screen.getByRole("button", { name: "Remove whatsapp 3" }));

    expect(saved.values).toEqual(["27833079258"]);
    expect(saved.labels).toEqual([""]);
    expect(screen.queryByDisplayValue("27735895924")).toBeNull();
  });

  it.each(["Email", "Phone", "WhatsApp"])("removes the only %s and its label", (label) => {
    let saved = { value: "only-contact", label: "Office" };

    function Contacts() {
      const [state, setState] = useState(saved);
      saved = state;
      return (
        <MultiContactField
          label={label}
          primary={state.value}
          onPrimaryChange={(value) => setState({ ...state, value })}
          onPrimaryRemove={() => setState({ value: "", label: "" })}
          primaryLabel={state.label}
          onPrimaryLabelChange={(label) => setState({ ...state, label })}
          extras={[]}
          onExtrasChange={() => undefined}
          extraLabels={[]}
          onExtraLabelsChange={() => undefined}
        />
      );
    }

    render(<Contacts />);
    fireEvent.click(screen.getByRole("button", { name: `Remove ${label.toLowerCase()}` }));

    expect(saved).toEqual({ value: "", label: "" });
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Office")).toBeNull();
    expect(screen.queryByRole("button", { name: `Remove ${label.toLowerCase()}` })).toBeNull();
  });
});
