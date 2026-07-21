import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "vite_react_shadcn_ts";

export const RemoveSaved = () => (
  <div style={{ position: "relative", minHeight: 300, padding: 32 }}>
    <AlertDialog open>
      <AlertDialogContent
        style={{
          position: "relative", transform: "none", left: "auto", top: "auto",
          maxWidth: 420, margin: "48px auto 0",
          zIndex: 60, backgroundColor: "hsl(var(--background))",
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this listing from your saved places?</AlertDialogTitle>
          <AlertDialogDescription>
            Buffalo Ridge Lodge will be removed from your Saved collection. You can
            always add it back from its listing page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep saved</AlertDialogCancel>
          <AlertDialogAction>Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
);
