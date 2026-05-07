import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessShell from "@/components/business/BusinessShell";
import { Card, Body, Small, H3 } from "@/components/business/ui";

const BusinessBilling = () => {
  const { account } = useBusinessOwner();
  return (
    <BusinessShell title="Billing" back="/business/dashboard">
      <Card style={{ marginTop: 24 }}>
        <H3>Plan</H3>
        <Body style={{ marginTop: 12 }}>Business plan</Body>
        <Small soft style={{ marginTop: 4 }}>Status: {account?.subscription_status ?? "inactive"}</Small>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <Body soft>Billing is being set up. Invoices, payment method and cancel options will appear here.</Body>
      </Card>
    </BusinessShell>
  );
};

export default BusinessBilling;
