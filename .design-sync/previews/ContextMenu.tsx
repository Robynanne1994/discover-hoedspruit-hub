import { useEffect, useRef } from "react";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
  ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut,
} from "vite_react_shadcn_ts";
import { Bookmark, Share2, EyeOff, MapPin } from "lucide-react";

export const CardActions = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const open = () => {
      const r = el.getBoundingClientRect();
      el.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: r.left + r.width / 2,
          clientY: r.top + r.height / 2,
        }),
      );
    };
    open();
    const t = setTimeout(open, 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ padding: "24px 24px 220px", display: "flex", justifyContent: "center" }}>
      <ContextMenu>
        <ContextMenuTrigger
          ref={ref}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 260, height: 90, borderRadius: 10, border: "1px dashed hsl(var(--border))",
            fontSize: 13, opacity: 0.7,
          }}
        >
          Blyde River Canyon listing
        </ContextMenuTrigger>
        <ContextMenuContent style={{ minWidth: 200 }}>
          <ContextMenuLabel>Quick actions</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <Bookmark size={15} style={{ marginRight: 8 }} /> Save place
          </ContextMenuItem>
          <ContextMenuItem>
            <MapPin size={15} style={{ marginRight: 8 }} /> Directions
          </ContextMenuItem>
          <ContextMenuItem>
            <Share2 size={15} style={{ marginRight: 8 }} /> Share
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <EyeOff size={15} style={{ marginRight: 8 }} /> Hide from feed
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};
