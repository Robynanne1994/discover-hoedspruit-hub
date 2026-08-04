// The rest of the account, for someone who signed up with Google or Apple.
//
// A provider signup hands over a verified email address and very little else:
// no username, no residency, and a name that may be a full name, a first name,
// or nothing at all. Without this screen the account exists with nothing on it
// — no handle anyone can find them by, no answer to "local or visitor", and a
// profile that reads as empty to everyone else. The address is already proved
// by the provider, so there is no code here; this is the other half of signing
// up, asked for at the first moment there is a session to write it with.
//
// App.tsx routes here whenever a signed-in account still has gaps, and back out
// again the moment it doesn't.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Seo from "@/components/Seo";
import { sanitiseUsername, validateUsername, USERNAME_MAX, USERNAME_HINT } from "@/lib/username";
import { signInMethodLabel } from "@/lib/authProviders";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEAD = "'Nohemi', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: FF,
  fontWeight: 700,
  fontSize: 14,
  lineHeight: "16.8px",
  color: "#1A1A1A",
  display: "block",
  marginBottom: 4,
};

const FIELD_STYLE: React.CSSProperties = {
  background: "#ffffff",
  color: "#1A1A1A",
  borderColor: "rgba(26,26,26,0.10)",
};

const RESIDENCY_OPTIONS = [
  { label: "Local", value: "I live in Hoedspruit" },
  { label: "Visitor", value: "I am a visitor in Hoedspruit" },
];

// Capitalise the first letter of each word as the user types, matching signup.
const capitaliseName = (value: string) =>
  value.replace(/(^|[\s'-])([a-z])/g, (_m, sep, ch) => sep + ch.toUpperCase());

/** Everything a provider might have told us about someone's name. */
function nameFromMetadata(metadata: Record<string, unknown> | undefined): string {
  const pick = (key: string) => {
    const value = metadata?.[key];
    return typeof value === "string" ? value.trim() : "";
  };
  const full = pick("full_name") || pick("name") || pick("display_name");
  if (full) return full;
  const first = pick("given_name") || pick("first_name");
  const last = pick("family_name") || pick("surname");
  return [first, last].filter(Boolean).join(" ");
}

/** A starting suggestion for the handle, from the address they signed up with. */
function suggestUsername(email: string | undefined): string {
  return sanitiseUsername((email || "").split("@")[0] || "");
}

const CompleteProfile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [residency, setResidency] = useState("");
  const [saving, setSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [prefilled, setPrefilled] = useState(false);

  const method = useMemo(() => signInMethodLabel(user), [user]);

  useEffect(() => {
    if (!loading && !user) navigate("/welcome", { replace: true });
  }, [loading, user, navigate]);

  // Pre-fill from whatever the provider and the profile row already know, so
  // most people only have to pick a username and answer one question.
  useEffect(() => {
    if (!user || prefilled) return;
    setPrefilled(true);
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, surname, display_name, username, location")
        .eq("id", user.id)
        .maybeSingle();

      const existingName = [
        (profile as any)?.first_name,
        (profile as any)?.surname,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      setFullName(
        existingName ||
          ((profile as any)?.display_name ?? "") ||
          nameFromMetadata(user.user_metadata as Record<string, unknown>),
      );
      setUsername(((profile as any)?.username as string) || suggestUsername(user.email));
      setResidency(((profile as any)?.location as string) || "");
    })();
  }, [user, prefilled]);

  // Live availability, so nobody finds out their handle is taken on submit.
  useEffect(() => {
    const handle = sanitiseUsername(username);
    if (validateUsername(handle)) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc(
        "is_username_available" as any,
        { _username: handle, _exclude_id: user?.id } as any,
      );
      if (cancelled) return;
      if (error) setUsernameStatus("idle");
      else setUsernameStatus(data ? "available" : "taken");
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, user?.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || !user) return;

    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const first = parts[0] ?? "";
    const last = parts.slice(1).join(" ");
    if (!first || !last) {
      toast.error("Please enter both your first and last name.");
      return;
    }

    const handle = sanitiseUsername(username);
    const usernameError = validateUsername(handle);
    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    if (!residency) {
      toast.error("Please let us know if you live in or are visiting Hoedspruit.");
      return;
    }

    setSaving(true);
    // Server-side check: RLS keeps a client from seeing anyone else's profile
    // row, so a clash is only ever visible through this RPC.
    const { data: available, error: checkError } = await supabase.rpc(
      "is_username_available" as any,
      { _username: handle, _exclude_id: user.id } as any,
    );
    if (checkError) {
      setSaving(false);
      toast.error(checkError.message);
      return;
    }
    if (!available) {
      setSaving(false);
      setUsernameStatus("taken");
      toast.error("That username is already taken. Please choose a different one.");
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: first,
      surname: last,
      display_name: `${first} ${last}`,
      username: handle,
      location: residency,
      email: user.email ?? null,
    } as any);
    setSaving(false);

    if (error) {
      toast.error(
        (error as any).code === "23505"
          ? "That username is already taken. Please choose a different one."
          : error.message || "Could not save your details. Please try again.",
      );
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["my-profile", user.id] });
    toast.success("You're all set. Welcome to Hoedspruit.");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#E6E0CC", fontFamily: FF }}>
      <Seo
        title="Finish setting up — Hello Hoedspruit"
        description="Add your name, username and whether you live in or are visiting Hoedspruit."
        path="/complete-profile"
        noIndex
      />
      <div className="flex-1 px-6 pb-12 pt-10 flex flex-col">
        <p
          style={{
            fontFamily: FF, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "#715A3D", margin: "0 0 6px",
          }}
        >
          Almost there
        </p>
        <h1
          style={{
            fontFamily: HEAD, fontSize: 34, fontWeight: 550, letterSpacing: "-0.02em",
            color: "#1A1A1A", lineHeight: 1.05, margin: "0 0 10px",
          }}
        >
          Finish your profile
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: "#6B6255", margin: "0 0 24px" }}>
          Your email is verified — you signed in with {method}, so there's no code to enter
          and no password to remember. We just need a few things before your profile is
          ready for the rest of Hoedspruit to see.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-4">
            <div>
              <Label htmlFor="cpFullName" style={LABEL_STYLE}>
                First &amp; Last Name
              </Label>
              <Input
                id="cpFullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(capitaliseName(e.target.value))}
                required
                autoCapitalize="words"
                placeholder="Your first and last name"
                className="h-12 rounded-xl bg-card border-border text-[15px]"
                style={FIELD_STYLE}
              />
            </div>

            <div>
              <Label htmlFor="cpUsername" style={LABEL_STYLE}>
                Username
              </Label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px]"
                  style={{ color: "#6B6A5E" }}
                >
                  @
                </span>
                <Input
                  id="cpUsername"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(sanitiseUsername(e.target.value))}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  maxLength={USERNAME_MAX}
                  placeholder="yourname"
                  className="h-12 rounded-xl bg-card border-border text-[15px] pl-8"
                  style={FIELD_STYLE}
                />
              </div>
              <p
                className="mt-1.5 text-[12px]"
                style={{
                  color:
                    usernameStatus === "taken"
                      ? "#B42318"
                      : usernameStatus === "available"
                        ? "#3F6B3F"
                        : "#6B6A5E",
                }}
              >
                {usernameStatus === "checking"
                  ? "Checking availability..."
                  : usernameStatus === "taken"
                    ? "That username is already taken."
                    : usernameStatus === "available"
                      ? `@${username} is available.`
                      : USERNAME_HINT}
              </p>
            </div>

            <div>
              <Label style={LABEL_STYLE}>Are you a local or a visitor?</Label>
              <Select value={residency} onValueChange={setResidency}>
                <SelectTrigger className="h-12 w-full rounded-xl border border-border bg-white px-4 text-[15px]">
                  <SelectValue
                    placeholder="Select one"
                    style={{ color: residency ? "#1A1A1A" : "#8A8480" }}
                  />
                </SelectTrigger>
                <SelectContent>
                  {RESIDENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-[15px]">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 font-medium rounded-full mt-6"
            style={{ background: "#423324", color: "#FFFFFF", fontSize: 16 }}
            disabled={saving || usernameStatus === "taken"}
          >
            {saving ? "Saving..." : "Finish & Continue"}
          </Button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "#2b2420" }}>
          Not you?{" "}
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate("/welcome", { replace: true });
            }}
            className="font-medium"
            style={{ color: "#715a3d" }}
          >
            Sign Out
          </button>
        </p>
      </div>
    </div>
  );
};

export default CompleteProfile;
