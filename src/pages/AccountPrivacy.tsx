import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { ArrowUpRight } from "lucide-react";

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
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: pendingRequestCount } = useQuery({
    queryKey: ["follow-request-count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", user!.id)
        .eq("status", "pending");
      return count ?? 0;
    },
  });

  const [isPrivate, setIsPrivate] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  useEffect(() => {
    if (profile) setIsPrivate(!!(profile as any).is_private);
  }, [profile]);

  const togglePrivacy = async (value: boolean) => {
    if (!user) return;
    setSavingPrivacy(true);
    const prev = isPrivate;
    setIsPrivate(value);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, is_private: value } as any);
    setSavingPrivacy(false);
    if (error) {
      setIsPrivate(prev);
      toast.error("Could not update privacy. Please try again.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    toast.success("Privacy updated.");
  };

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, paddingBottom: 100, fontFamily: FF }}>
      <PageHeader title="Account Privacy" />
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ background: CARD, borderRadius: 16, padding: "4px 20px" }}>
          <PrivacyToggleRow
            label="Private Account"
            description="New followers will need your approval before they can view your profile."
            checked={isPrivate}
            disabled={savingPrivacy}
            onChange={togglePrivacy}
            isFirst
          />
          {isPrivate && (
            <div
              onClick={() => navigate("/follow-requests")}
              style={{
                borderTop: `1px solid ${LINE}`,
                padding: "16px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontFamily: FF, fontSize: 15, color: INK }}>Follow Requests</div>
                <div style={{ fontFamily: FF, fontSize: 12.5, color: MUTED, marginTop: 2 }}>
                  {pendingRequestCount
                    ? `${pendingRequestCount} pending`
                    : "No pending requests"}
                </div>
              </div>
              <ArrowUpRight size={18} color={INK} style={{ flexShrink: 0 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPrivacy;
