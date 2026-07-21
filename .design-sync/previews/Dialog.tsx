import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button,
} from "vite_react_shadcn_ts";

export const Confirm = () => (
  <Dialog open modal={false}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Blyde River Canyon Lodge to your trip?</DialogTitle>
        <DialogDescription>
          We'll save this listing to your itinerary and notify you of upcoming
          specials and events nearby.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button>Add to trip</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
