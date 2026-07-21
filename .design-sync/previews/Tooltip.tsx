import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, Button,
} from "vite_react_shadcn_ts";
import { Info } from "lucide-react";

export const HelpLabel = () => (
  <div style={{ padding: "90px 24px 24px", display: "flex", justifyContent: "center" }}>
    <TooltipProvider>
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <Info size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Load-shedding times are updated hourly from Eskom.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);
