import { useNavigate } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const HomeMasthead = () => {
  const navigate = useNavigate();
  return (
    <PageHeader
      title="Hello Hoedspruit"
      rightIcons={[
        { key: "search", label: "Search", onClick: () => navigate("/search"), icon: <Search size={22} strokeWidth={1.8} /> },
        { key: "notifications", label: "Notifications", onClick: () => navigate("/my-notifications"), icon: <Bell size={22} strokeWidth={1.8} /> },
      ]}
    />
  );
};

export default HomeMasthead;
