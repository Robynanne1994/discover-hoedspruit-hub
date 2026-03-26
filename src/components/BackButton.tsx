import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="inline-flex items-center gap-2 text-primary hover:underline mb-4 text-sm font-medium"
    >
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  );
};

export default BackButton;
