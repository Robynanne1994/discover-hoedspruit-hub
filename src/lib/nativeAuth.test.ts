import { beforeEach, describe, expect, it, vi } from "vitest";

// nativeAuth reaches for the Supabase client and the Capacitor bridge at import
// time. Only the Apple-name helper is under test here, so both are stubbed.
const getUser = vi.fn();
const updateUser = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: () => getUser(), updateUser: (a: unknown) => updateUser(a) } },
}));
vi.mock("@/lib/nativeBridge", () => ({
  isNativeApp: () => true,
  nativePlatform: () => "ios",
}));

const { rememberAppleName } = await import("./nativeAuth");

const noName = { data: { user: { id: "u1", user_metadata: {} } } };

beforeEach(() => {
  getUser.mockReset().mockResolvedValue(noName);
  updateUser.mockReset().mockResolvedValue({ error: null });
});

describe("rememberAppleName", () => {
  it("saves the name Apple supplied on a first authorization", async () => {
    await rememberAppleName("Robyn", "McDonald");
    expect(updateUser).toHaveBeenCalledWith({
      data: { full_name: "Robyn McDonald", given_name: "Robyn", family_name: "McDonald" },
    });
  });

  it("copes with only one half of the name", async () => {
    await rememberAppleName("Robyn", null);
    expect(updateUser).toHaveBeenCalledWith({
      data: { full_name: "Robyn", given_name: "Robyn" },
    });
  });

  // Apple returns the name exactly once — every later sign-in sends null. The
  // account already carries whatever the first one saved, so there is nothing
  // to do and certainly nothing to blank out.
  it("does nothing when Apple sends no name", async () => {
    await rememberAppleName(null, null);
    await rememberAppleName("   ", "");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("never overwrites a name the account already has", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", user_metadata: { full_name: "Robyn Dawes" } } },
    });
    await rememberAppleName("Robyn", "McDonald");
    expect(updateUser).not.toHaveBeenCalled();
  });

  // The sign-in has already succeeded by this point; a failure saving the name
  // must not turn that into a failed login.
  it("stays quiet when the write fails", async () => {
    updateUser.mockRejectedValue(new Error("network"));
    await expect(rememberAppleName("Robyn", "McDonald")).resolves.toBeUndefined();
  });
});
