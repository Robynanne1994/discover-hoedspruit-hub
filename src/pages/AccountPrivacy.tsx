import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollowRequestCount } from "@/hooks/useFollows";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { ArrowUpRight } from "lucide-react";
import { SECTION_INSET, type } from "@/lib/type";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PAGE_BG = "#E6E0CC";
const CARD = "#FFFFFF";
const INK = "#1A1A1A";
const MUTED = "#9C9387";
const LINE = "#EAE4D5";
const DARK = "#3D2E22";

const PrivacyToggleRow = ({
  label,
  description,
  checked,
  disabled,
  onChange,
  isFirst,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  isFirst?: boolean;
}) => (
  <div
    style={{
      borderTop: isFirst ? "none" : `1px solid ${LINE}`,
      padding: "16px 0",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: FF, fontSize: 15, color: INK }}>{label}</div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        background: checked ? DARK : "#D8D2C2",
        border: "none",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        transition: "background 120ms ease",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 120ms ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  </div>
);

const AccountPrivacy = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate("/my-profile-guest", { replace: true });
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: pendingRequestCount } = useFollowRequestCount();

  // The switch state is derived straight from the cached profile so it is
  // correct on the very first paint when navigating back to this page.
  // pendingPrivate only overrides it while a save is in flight.
  const [pendingPrivate, setPendingPrivate] = useState<boolean | null>(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const isPrivate = pendingPrivate ?? !!(profile as any)?.is_private;

  const togglePrivacy = async (value: boolean) => {
    if (!user) return;
    // How many people were still waiting, read before the write: going public
    // approves the lot server-side, so afterwards the count is always zero and
    // there would be nothing left to tell the user about.
    const waiting = pendingRequestCount ?? 0;
    setSavingPrivacy(true);
    setPendingPrivate(value);
    const { error } = await supabase
      .from("profiles")
      .update({ is_private: value } as any)
      .eq("id", user.id);
    setSavingPrivacy(false);
    if (error) {
      setPendingPrivate(null);
      toast.error("Could not update privacy. Please try again.");
      return;
    }
    queryClient.setQueryData(["profile", user.id], (old: any) =>
      old ? { ...old, is_private: value } : { id: user.id, is_private: value }
    );
    setPendingPrivate(null);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    queryClient.invalidateQueries({ queryKey: ["follow-request-count"] });
    queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
    queryClient.invalidateQueries({ queryKey: ["follow-counts"] });
    queryClient.invalidateQueries({ queryKey: ["followers"] });

    if (!value && waiting > 0) {
      toast.success(
        `Your account is public. ${waiting} pending follow ${waiting === 1 ? "request was" : "requests were"} approved.`,
      );
      return;
    }
    toast.success(value ? "Your account is now private." : "Your account is now public.");
  };

  const Switch = ({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        background: checked ? DARK : "#D8D2C2",
        border: "none",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        transition: "background 120ms ease",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 120ms ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );

  const visibilityRows: SettingsRowItem[] = [
    {
      label: "Private Account",
      icon: Lock,
      trailing: <Switch checked={isPrivate} disabled={savingPrivacy} onChange={togglePrivacy} />,
    },
  ];
  // Also shown for a public account that still has requests waiting (legacy
  // rows from before going public approved them), so nobody is left queued
  // behind a row that has disappeared.
  if (isPrivate || (pendingRequestCount ?? 0) > 0) {
    visibilityRows.push({
      label: "Follow Requests",
      icon: UserCheck,
      subtitle: pendingRequestCount
        ? `${pendingRequestCount} pending ${pendingRequestCount === 1 ? "request" : "requests"}`
        : "No pending requests",
      onClick: () => navigate("/follow-requests"),
    });
  }

  const safetyRows: SettingsRowItem[] = [
    { label: "Blocked", icon: Ban, onClick: () => navigate("/account-settings/blocked") },
    { label: "Reported", icon: Flag, onClick: () => navigate("/account-settings/reported") },
    { label: "Account Notices", icon: FileText, onClick: () => navigate("/account-notices") },
  ];

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 100, fontFamily: FF }}>
      <PageHeader title="Account Privacy" />

      <div style={{ height: 24 }} />

      <div style={{ marginBottom: 28 }}>
        <SettingsEyebrow>Visibility</SettingsEyebrow>
        <SettingsCard items={visibilityRows} />
        <p style={{ fontFamily: FF, fontSize: 12.5, color: MUTED, lineHeight: 1.5, margin: "16px 24px 0" }}>
          When your account is public, your profile and saved content can be seen by anyone on the Hello Hoedspruit app. When your account is private, only the followers that you approve can see what you save, who you follow and your followers. Certain info on your profile, such as your profile picture, name, surname and username, is visible to everyone on the Hello Hoedspruit.{" "}
          <a
            href="https://hellohoedspruit.co/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#715a3d", fontWeight: 700, cursor: "pointer", textDecoration: "none" }}
          >
            Learn More
          </a>
        </p>
      </div>

      <SettingsSection label="Safety" items={safetyRows} />
    </div>
  );
};

export default AccountPrivacy;


