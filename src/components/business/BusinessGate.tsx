import { Navigate, Outlet } from "react-router-dom";
import { useBusinessOwner } from "@/hooks/useBusinessOwner";

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const Loading = () => (
  <div style={{ minHeight: "100vh", background: "#5C6446", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "#020202" }}>
    Loading...
  </div>
);

/**
 * Gates business portal routes. Requires sign-in and the business_owner role.
 * Subscription gating is intentionally a no-op for now (no payments yet).
 */
const BusinessGate = () => {
  const { user, authLoading, loading, isOwner } = useBusinessOwner();
  if (authLoading || loading) return <Loading />;
  if (!user) return <Navigate to="/business/sign-in" replace />;
  if (!isOwner) return <Navigate to="/business/start" replace />;
  return <Outlet />;
};

export default BusinessGate;
