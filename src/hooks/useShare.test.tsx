import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ShareProvider, useShare } from "@/hooks/useShare";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const originalLocation = window.location;

const setOrigin = (origin: string, pathname = "/") => {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { origin, pathname, search: "", href: `${origin}${pathname}` },
  });
};

const Trigger = () => {
  const share = useShare();
  return (
    <button onClick={() => share({ title: "Mad Dogz", text: "Burgers", url: "/listing/1" })}>
      Share this
    </button>
  );
};

const renderTrigger = () =>
  render(
    <ShareProvider>
      <Trigger />
    </ShareProvider>,
  );

afterEach(() => {
  Object.defineProperty(window, "location", { writable: true, value: originalLocation });
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ShareProvider", () => {
  it("opens the system share sheet when the runtime has one", async () => {
    setOrigin("https://hellohoedspruit.co.za");
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share });

    renderTrigger();
    fireEvent.click(screen.getByRole("button", { name: "Share this" }));

    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: "Mad Dogz",
        text: "Burgers",
        url: "https://hellohoedspruit.co.za/listing/1",
      }),
    );
    // The OS sheet did the job — the in-app one must stay out of the way.
    expect(screen.queryByRole("dialog", { name: "Share" })).toBeNull();
  });

  it("stays quiet when the user backs out of the system sheet", async () => {
    setOrigin("https://hellohoedspruit.co.za");
    const err = new Error("Abort due to cancellation of share.");
    err.name = "AbortError";
    vi.stubGlobal("navigator", { ...navigator, share: vi.fn().mockRejectedValue(err) });

    renderTrigger();
    fireEvent.click(screen.getByRole("button", { name: "Share this" }));

    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByRole("dialog", { name: "Share" })).toBeNull();
  });

  it("falls back to the in-app sheet when there is no system sheet", async () => {
    setOrigin("https://hellohoedspruit.co.za");
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

    renderTrigger();
    fireEvent.click(screen.getByRole("button", { name: "Share this" }));

    const sheet = await screen.findByRole("dialog", { name: "Share" });
    expect(sheet).toBeInTheDocument();
    // Copy link plus the "share via" targets, exactly like a native sheet.
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share via WhatsApp" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share via Email" })).toBeInTheDocument();
    expect(screen.getByText("hellohoedspruit.co.za/listing/1")).toBeInTheDocument();
  });

  it("falls back to the in-app sheet when the system sheet errors", async () => {
    setOrigin("https://hellohoedspruit.co.za");
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new Error("Permission denied")),
      clipboard: { writeText: vi.fn() },
    });

    renderTrigger();
    fireEvent.click(screen.getByRole("button", { name: "Share this" }));

    expect(await screen.findByRole("dialog", { name: "Share" })).toBeInTheDocument();
  });

  it("copies the absolute link from the in-app sheet", async () => {
    setOrigin("https://hellohoedspruit.co.za");
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    renderTrigger();
    fireEvent.click(screen.getByRole("button", { name: "Share this" }));
    fireEvent.click(await screen.findByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith("https://hellohoedspruit.co.za/listing/1");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Share" })).toBeNull());
  });

  it("hands a target link to the browser and closes", async () => {
    setOrigin("https://hellohoedspruit.co.za");
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn() } });
    const open = vi.fn();
    vi.stubGlobal("open", open);

    renderTrigger();
    fireEvent.click(screen.getByRole("button", { name: "Share this" }));
    fireEvent.click(await screen.findByRole("button", { name: "Share via WhatsApp" }));

    expect(open).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/?text=Mad%20Dogz"),
      "_blank",
      "noopener,noreferrer",
    );
    expect(screen.queryByRole("dialog", { name: "Share" })).toBeNull();
  });

  it("closes the in-app sheet on Cancel", async () => {
    setOrigin("https://hellohoedspruit.co.za");
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn() } });

    renderTrigger();
    fireEvent.click(screen.getByRole("button", { name: "Share this" }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Share" })).toBeNull();
  });
});
