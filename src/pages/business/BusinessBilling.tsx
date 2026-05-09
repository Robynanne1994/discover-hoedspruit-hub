import { useBusinessOwner } from "@/hooks/useBusinessOwner";
import BusinessLayout from "@/components/business/BusinessLayout";
import { Card, Body, Small, H3 } from "@/components/business/ui";

const BusinessBilling = () => {
  const { account, listing } = useBusinessOwner();
  return (
    <BusinessLayout businessName={account?.business_name || listing?.title || null}>
      <Card style={{ marginTop: 4 }}>
        <H3>Plan</H3>
        <Body style={{ marginTop: 12 }}>Business plan</Body>
        <Small soft style={{ marginTop: 4 }}>Status: {account?.subscription_status ?? "inactive"}</Small>
      </Card>
      <Card style={{ marginTop: 12 }}>
        <Body soft>Billing is being set up. Invoices, payment method and cancel options will appear here.</Body>
      </Card>
    </BusinessLayout>
  );
};

export default BusinessBilling;
