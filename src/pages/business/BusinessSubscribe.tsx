import { useNavigate } from "react-router-dom";
import BusinessShell from "@/components/business/BusinessShell";
import { Button, Card, H3, Body, Small, COLORS } from "@/components/business/ui";

/**
 * Subscribe page placeholder. Payments are not enabled yet.
 * For now, the "Continue" button just routes the owner into the dashboard.
 * When Stripe is enabled (Phase 3), this opens Stripe Checkout instead and
 * subscription_status flips to 'active' on webhook success.
 */
const BusinessSubscribe = () => {
  const navigate = useNavigate();
  return (
    <BusinessShell title="Subscribe" back="/business/sign-up">
      <Card style={{ marginTop: 24 }}>
        <H3>Business plan</H3>
        <p style={{ fontSize: 53, fontWeight: 400, color: COLORS.heading, margin: "16px 0 4px", lineHeight: 1 }}>
          R499<span style={{ fontSize: 16, color: COLORS.bodySoft }}>/month</span>
        </p>
        <Small soft>Cancel any time</Small>
        <div style={{ height: 1, background: COLORS.divider, margin: "20px 0" }} />
        <Body style={{ marginBottom: 12 }}>What is included</Body>
        <ul style={{ margin: 0, paddingLeft: 18, color: COLORS.body, fontSize: 15, lineHeight: 1.6 }}>
          <li>Claim and edit your listing</li>
          <li>Post specials and events</li>
          <li>Manage opening hours</li>
          <li>Apply to feature your content</li>
        </ul>
        <div style={{ marginTop: 24 }}>
          <Button full onClick={() => navigate("/business/dashboard")}>Continue</Button>
        </div>
        <Small soft style={{ marginTop: 12, textAlign: "center" }}>
          Billing is being set up. You can use the portal in the meantime.
        </Small>
      </Card>
    </BusinessShell>
  );
};

export default BusinessSubscribe;
