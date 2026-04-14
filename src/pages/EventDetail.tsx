import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  RotateCcw,
  Share2,
  ChevronLeft,
  Heart,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isFavourited } = useQuery({
    queryKey: ["favourite", "event", id, user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data } = await supabase
        .from("favourites" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", id!)
        .eq("item_type", "event")
        .maybeSingle();

      return !!data;
    },
    enabled: !!user && !!id,
  });

  const toggleFavourite = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Please sign in to save events");
        return;
      }

      if (isFavourited) {
        await supabase
          .from("favourites" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("item_id", id!)
          .eq("item_type", "event");
      } else {
        await supabase.from("favourites" as any).insert({ user_id: user.id, item_id: id!, item_type: "event" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favourite", "event", id] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      toast.success(isFavourited ? "Removed from saved" : "Event saved!");
    },
  });

  const { data: event, isLoading } = useQuery({
    queryKey: ["event-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id!).single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const formatTime = (time: string | null) => {
    if (!time) return null;
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    if (isNaN(hour)) return time;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied!");
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: "#FFFFFF" }}>
        <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
            <ChevronLeft style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.45)" }} />
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "rgba(18,18,20,0.45)",
                letterSpacing: "0.2px",
              }}
            >
              Back
            </span>
          </button>
        </div>

        <div
          className="flex flex-col items-center justify-center"
          style={{ paddingTop: 80, paddingLeft: 24, paddingRight: 24 }}
        >
          <div
            className="animate-pulse"
            style={{
              width: 48,
              height: 48,
              borderRadius: 9999,
              background: "rgba(18,18,20,0.06)",
              marginBottom: 14,
            }}
          />
          <p style={{ fontSize: 13, color: "rgba(18,18,20,0.4)" }}>Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen pb-24" style={{ background: "#FFFFFF" }}>
        <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
            <ChevronLeft style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.45)" }} />
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "rgba(18,18,20,0.45)",
                letterSpacing: "0.2px",
              }}
            >
              Back
            </span>
          </button>
        </div>

        <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 80, textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 22,
              color: "#2b2420",
              marginBottom: 8,
            }}
          >
            Event not found
          </p>
          <p style={{ fontSize: 13, color: "rgba(18,18,20,0.45)", lineHeight: 1.5 }}>
            This event may have been removed or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  const timeDisplay = event.start_time
    ? `${formatTime(event.start_time)}${event.end_time ? ` – ${formatTime(event.end_time)}` : ""}`
    : null;

  const mapsLink = (event as any).google_maps_link || null;
  const socialLink = (event as any).social_media_link || null;
  const contactEmail = (event as any).contact_email || null;
  const contactPhone = (event as any).contact_phone || null;
  const galleryImages: string[] = (event as any).gallery_images ?? [];
  const bookingLink = (event as any).booking_link || null;
  const price = (event as any).price || null;

  const detailRows = [
    { label: "Date", value: formatDate(event.date), icon: Calendar, href: null as string | null },
    { label: "Time", value: timeDisplay, icon: Clock, href: null as string | null },
    { label: "Venue", value: event.location, icon: MapPin, href: mapsLink },
    { label: "Category", value: event.tag, icon: Tag, href: null as string | null },
    { label: "Recurrence", value: event.recurrence, icon: RotateCcw, href: null as string | null },
    { label: "Price", value: price, icon: Banknote, href: null as string | null },
  ].filter((row) => row.value);

  const contactRows = [
    contactEmail ? { label: "Email", value: contactEmail, icon: Mail, href: `mailto:${contactEmail}` } : null,
    contactPhone
      ? {
          label: "Phone",
          value: contactPhone,
          icon: Phone,
          href: `tel:${contactPhone.replace(/\s/g, "")}`,
        }
      : null,
    socialLink ? { label: "Social Media", value: "View Profile", icon: Globe, href: socialLink } : null,
    bookingLink ? { label: "Booking", value: "Book Now", icon: ExternalLink, href: bookingLink } : null,
  ].filter(Boolean) as { label: string; value: string; icon: any; href: string }[];

  const SectionLabel = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
    <div style={{ marginBottom: 14 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "rgba(18,18,20,0.3)",
          textTransform: "uppercase",
          letterSpacing: 2.2,
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </p>
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 900,
          fontSize: 20,
          lineHeight: 1,
          letterSpacing: "-0.3px",
          color: "#2b2420",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {title}
      </h2>
    </div>
  );

  return (
    <div className="min-h-screen pb-28" style={{ background: "#FFFFFF" }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 24, paddingRight: 24, marginBottom: 18 }}>
        <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
          <ChevronLeft style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.45)" }} />
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "rgba(18,18,20,0.45)",
              letterSpacing: "0.2px",
            }}
          >
            Back
          </span>
        </button>
      </div>

      {/* Hero Image */}
      {event.image_url && (
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 22 }}>
          <div
            style={{
              width: "100%",
              overflow: "hidden",
              borderRadius: 16,
              background: "#f0f0f0",
              aspectRatio: "4 / 3",
            }}
          >
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Title */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        {event.tag && (
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(18,18,20,0.3)",
              textTransform: "uppercase",
              letterSpacing: 2.2,
              marginBottom: 10,
            }}
          >
            {event.tag}
          </p>
        )}

        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 900,
            fontSize: 34,
            lineHeight: 0.98,
            letterSpacing: "-0.6px",
            color: "#2b2420",
            margin: 0,
            textTransform: "uppercase",
          }}
        >
          {event.title}
        </h1>

        {(event.date || timeDisplay) && (
          <p
            style={{
              marginTop: 14,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: 14,
              color: "rgba(18,18,20,0.42)",
              lineHeight: 1.45,
              letterSpacing: "0.15px",
            }}
          >
            {formatDate(event.date)}
            {timeDisplay ? ` · ${timeDisplay}` : ""}
          </p>
        )}
      </div>

      {/* About */}
      {event.description && (
        <section style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 34 }}>
          <SectionLabel eyebrow="Overview" title="About" />
          <div
            style={{
              background: "rgba(18,18,20,0.03)",
              border: "1px solid rgba(18,18,20,0.06)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: "rgba(18,18,20,0.58)",
                lineHeight: 1.85,
                letterSpacing: "0.1px",
              }}
            >
              {event.description}
            </p>
          </div>
        </section>
      )}

      {/* Details */}
      {detailRows.length > 0 && (
        <section style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 34 }}>
          <SectionLabel eyebrow="Event info" title="Details" />
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(18,18,20,0.06)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {detailRows.map((row, idx) => {
              const Wrapper = row.href ? "a" : "div";
              const wrapperProps = row.href
                ? {
                    href: row.href,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  }
                : {};

              return (
                <Wrapper
                  key={row.label}
                  {...wrapperProps}
                  className={row.href ? "transition-colors hover:bg-[rgba(18,18,20,0.02)]" : ""}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "18px 18px",
                    borderBottom: idx < detailRows.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none",
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "rgba(18,18,20,0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <row.icon style={{ width: 16, height: 16, color: "rgba(18,18,20,0.42)" }} strokeWidth={1.8} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 12,
                        color: "rgba(18,18,20,0.38)",
                        margin: 0,
                        marginBottom: 4,
                        lineHeight: 1.2,
                      }}
                    >
                      {row.label}
                    </p>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: row.href ? "#2b2420" : "#2b2420",
                        lineHeight: 1.4,
                        margin: 0,
                        wordBreak: "break-word",
                      }}
                    >
                      {row.value}
                    </p>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        </section>
      )}

      {/* Contact */}
      {contactRows.length > 0 && (
        <section style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 34 }}>
          <SectionLabel eyebrow="Reach out" title="Contact" />
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(18,18,20,0.06)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {contactRows.map((row, idx) => (
              <a
                key={row.label}
                href={row.href}
                target={row.label === "Social Media" || row.label === "Booking" ? "_blank" : undefined}
                rel={row.label === "Social Media" || row.label === "Booking" ? "noopener noreferrer" : undefined}
                className="transition-colors hover:bg-[rgba(18,18,20,0.02)]"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "18px 18px",
                  borderBottom: idx < contactRows.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "rgba(18,18,20,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <row.icon style={{ width: 16, height: 16, color: "rgba(18,18,20,0.42)" }} strokeWidth={1.8} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(18,18,20,0.38)",
                      margin: 0,
                      marginBottom: 4,
                      lineHeight: 1.2,
                    }}
                  >
                    {row.label}
                  </p>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: "#2b2420",
                      lineHeight: 1.4,
                      margin: 0,
                      wordBreak: "break-word",
                    }}
                  >
                    {row.value}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 14 }}>
            <SectionLabel eyebrow="Moments" title="Gallery" />
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <div
              className="inline-flex"
              style={{
                gap: 12,
                paddingLeft: 24,
                paddingRight: 24,
                paddingBottom: 4,
              }}
            >
              {galleryImages.map((url, i) => (
                <div
                  key={i}
                  style={{
                    width: 220,
                    aspectRatio: "4 / 3",
                    borderRadius: 16,
                    overflow: "hidden",
                    background: "#f0f0f0",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={url}
                    alt={`${event.title} ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Actions */}
      <div style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 8 }}>
        <div className="flex" style={{ gap: 12 }}>
          <button
            onClick={handleShare}
            className="flex items-center justify-center transition-colors"
            style={{
              flex: 1,
              gap: 8,
              height: 54,
              borderRadius: 14,
              background: "rgba(18,18,20,0.04)",
              border: "1px solid rgba(18,18,20,0.08)",
              color: "#2b2420",
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "0.1px",
            }}
          >
            <Share2 style={{ width: 16, height: 16, color: "rgba(18,18,20,0.5)" }} strokeWidth={1.9} />
            Share
          </button>

          <button
            onClick={() => toggleFavourite.mutate()}
            className="flex items-center justify-center transition-colors"
            style={{
              flex: 1,
              gap: 8,
              height: 54,
              borderRadius: 14,
              background: isFavourited ? "#121214" : "rgba(18,18,20,0.04)",
              border: isFavourited ? "1px solid #121214" : "1px solid rgba(18,18,20,0.08)",
              color: isFavourited ? "#FFFFFF" : "#2b2420",
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "0.1px",
            }}
          >
            <Heart
              style={{
                width: 16,
                height: 16,
                color: isFavourited ? "#FFFFFF" : "rgba(18,18,20,0.5)",
                fill: isFavourited ? "#FFFFFF" : "transparent",
              }}
              strokeWidth={1.9}
            />
            Interested
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
