import { Alert, AlertTitle, AlertDescription } from "vite_react_shadcn_ts";
import { Info, TriangleAlert } from "lucide-react";

export const Default = () => (
  <div style={{ padding: 24, maxWidth: 460 }}>
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Load-shedding update</AlertTitle>
      <AlertDescription>
        Stage 2 is scheduled for Hoedspruit from 18:00–20:30 today. Local
        businesses on the app show their backup-power status.
      </AlertDescription>
    </Alert>
  </div>
);

export const Destructive = () => (
  <div style={{ padding: 24, maxWidth: 460 }}>
    <Alert variant="destructive">
      <TriangleAlert className="h-4 w-4" />
      <AlertTitle>Road closure</AlertTitle>
      <AlertDescription>
        The R527 near the Olifants bridge is closed for repairs. Allow extra
        time and use the R40 as an alternative route.
      </AlertDescription>
    </Alert>
  </div>
);
