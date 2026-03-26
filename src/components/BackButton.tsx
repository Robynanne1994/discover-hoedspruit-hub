import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
}

const BackButton = ({ className }: BackButtonProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={cn("inline-flex items-center gap-2 text-primary hover:underline mb-4 text-sm font-medium", className)}
    >
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  );
};

export default BackButton;
