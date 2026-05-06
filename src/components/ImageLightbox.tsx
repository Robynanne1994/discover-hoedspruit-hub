import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alt?: string;
}

const ImageLightbox = ({ images, initialIndex, open, onOpenChange, alt = "" }: ImageLightboxProps) => {
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
        className="p-0 border-0 max-w-none w-screen h-screen sm:rounded-none flex items-center justify-center [&>button]:hidden"
        style={{ background: "#ebebeb" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 20,
            width: 44, height: 44, borderRadius: 999,
            background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={22} color="#fff" strokeWidth={2} />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", zIndex: 20,
                width: 44, height: 44, borderRadius: 999,
                background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ChevronLeft size={24} color="#fff" strokeWidth={2} />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", zIndex: 20,
                width: 44, height: 44, borderRadius: 999,
                background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <ChevronRight size={24} color="#fff" strokeWidth={2} />
            </button>
          </>
        )}

        <img
          src={images[index]}
          alt={`${alt} ${index + 1}`}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
        />

        {images.length > 1 && (
          <div style={{
            position: "absolute", bottom: 24, left: 0, right: 0, zIndex: 20,
            display: "flex", justifyContent: "center",
          }}>
            <div style={{
              padding: "6px 12px", borderRadius: 999,
              background: "rgba(255,255,255,0.14)", color: "#fff",
              fontFamily: "'Pragmatica', 'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 12, letterSpacing: "0.02em",
            }}>
              {index + 1} / {images.length}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
