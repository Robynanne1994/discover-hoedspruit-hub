import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessAccount {
  id: string;
  user_id: string;
  business_name: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  subscription_status: string;
}

export interface OwnedListing {
  id: string;
  title: string;
  image_url: string | null;
  location: string | null;
}

export const useBusinessOwner = () => {
  const { user, loading: authLoading } = useAuth();
  const [account, setAccount] = useState<BusinessAccount | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [listing, setListing] = useState<OwnedListing | null>(null);
  const [pendingClaim, setPendingClaim] = useState<{ id: string; status: string; listing_id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setAccount(null);
      setIsOwner(false);
      setListing(null);
      setPendingClaim(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [{ data: roleRows }, { data: acc }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("business_accounts").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    const owner = !!roleRows?.some((r: any) => r.role === "business_owner");
    setIsOwner(owner);
    setAccount(acc as BusinessAccount | null);

    const { data: list } = await supabase
      .from("listings")
      .select("id, title, image_url, location")
      .eq("business_owner_id", user.id)
      .maybeSingle();
    setListing(list as OwnedListing | null);

    if (!list) {
      const { data: claim } = await supabase
        .from("claim_requests")
        .select("id, status, listing_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setPendingClaim(claim as any);
    } else {
      setPendingClaim(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, refresh]);

  return { user, authLoading, loading, account, isOwner, listing, pendingClaim, refresh };
};
