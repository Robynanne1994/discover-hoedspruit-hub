import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alt?: string;
  title?: string;
}

const ImageLightbox = ({ images, initialIndex, open, onOpenChange, alt = "", title }: ImageLightboxProps) => {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next]);

  // Touch swipe
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) (dx > 0 ? prev : next)();
    setTouchStartX(null);
  };

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 max-w-none w-screen h-screen sm:rounded-none flex-col [&>button]:hidden"
        style={{ background: "#FFFFFF", display: "flex" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        {title && (
          <div style={{
            position: "absolute", top: 72, left: 40, right: 40, zIndex: 20,
            textAlign: "center",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 13, lineHeight: 1.4, fontWeight: 500, color: "#5F5E52",
          }}>
            {title}
          </div>
        )}

        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 20,
            width: 44, height: 44, borderRadius: 999,
            background: "#E6E0CC", border: "1px solid #E2DAC6", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px -1px rgba(0,0,0,0.06)",
          }}
        >
          <X size={20} color="#1A1A1A" strokeWidth={2} />
        </button>

        <div
          style={{
            flex: "1 1 auto", minHeight: 0, width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            paddingTop: 64, paddingBottom: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
        >
          <img
            src={images[index]}
            alt={`${alt} ${index + 1}`}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
          />
        </div>

        {images.length > 1 && (
          <div
            style={{
              flex: "0 0 auto", width: "100%", padding: "12px 16px 28px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 24,
              zIndex: 20,
            }}
          >
            <button
              onClick={prev}
              aria-label="Previous image"
              style={{
                width: 48, height: 48, borderRadius: 999,
                background: "#F5F0E8", border: "1px solid #E2DAC6", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ChevronLeft size={26} color="#1A1A1A" strokeWidth={2} />
            </button>
            <div style={{
              padding: "6px 14px", borderRadius: 999,
              background: "#F5F0E8", color: "#1A1A1A",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 13, letterSpacing: "0.02em", minWidth: 56, textAlign: "center",
            }}>
              {index + 1} / {images.length}
            </div>
            <button
              onClick={next}
              aria-label="Next image"
              style={{
                width: 48, height: 48, borderRadius: 999,
                background: "#F5F0E8", border: "1px solid #E2DAC6", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ChevronRight size={26} color="#1A1A1A" strokeWidth={2} />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
