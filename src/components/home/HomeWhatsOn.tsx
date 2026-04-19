import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HomeSectionHead from "./HomeSectionHead";

const SANS = "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif";
const SERIF = "'Playfair Display', 'Helvetica Neue', serif";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const HomeWhatsOn = () => {
  const { data: events } = useQuery({
    queryKey: ["home-whats-on"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, location, date")
        .order("date", { ascending: true })
        .limit(20);
      const now = new Date();
      const today = new Date(now.toDateString());
      return (data || [])
        .map((e) => {
          const d = new Date(e.date);
          return { ...e, parsed: isNaN(d.getTime()) ? null : d };
        })
        .filter((e) => !e.parsed || e.parsed >= today)
        .slice(0, 4);
    },
  });

  if (!events || events.length === 0) return null;

  return (
    <section>
      <HomeSectionHead primary="What's on" actionLabel="All events" actionHref="/events" />
      <div style={{ padding: "0 24px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "4px 20px" }}>
          {events.map((e, idx) => (
            <Link
              key={e.id}
              to={`/events/${e.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "18px 0",
                borderBottom: idx < events.length - 1 ? "1px solid #F2EFEC" : "none",
                textDecoration: "none",
              }}
            >
              <div style={{ width: 44, flexShrink: 0, textAlign: "left" }}>
                {e.parsed ? (
                  <>
                    <div
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 300,
                        fontSize: 36,
                        lineHeight: 0.9,
                        color: "#0A0A0A",
                      }}
                    >
                      {e.parsed.getDate()}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontFamily: SANS,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#8A8480",
                      }}
                    >
                      {MONTHS[e.parsed.getMonth()]}
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#8A8480",
                    }}
                  >
                    TBA
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 16,
                    color: "#0A0A0A",
                    lineHeight: 1.25,
                    marginBottom: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {e.title}
                </div>
                {e.location && (
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 13,
                      color: "#8A8480",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.location}
                  </div>
                )}
              </div>
              <ChevronRight size={16} color="#8A8480" strokeWidth={2} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeWhatsOn;
