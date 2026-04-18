import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const SECTION_ORDER = [
  "About Hello Hoedspruit",
  "Using the App",
  "Listings & Information",
  "For Business Owners",
  "Account & Privacy",
  "General",
];

const FAQs = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openItem, setOpenItem] = useState<string | null>(null);

  const { data: faqs, isLoading } = useQuery({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });
      return data || [];
    },
  });

  const sections = useMemo(() => {
    if (!faqs) return [];
    const grouped: Record<string, typeof faqs> = {};
    faqs.forEach((faq) => {
      if (!grouped[faq.section]) grouped[faq.section] = [];
      grouped[faq.section].push(faq);
    });
    return SECTION_ORDER
      .filter((s) => grouped[s]?.length)
      .map((s) => ({ title: s, items: grouped[s] }));
  }, [faqs]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [search, sections]);

  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ebebeb", paddingBottom: 84, fontFamily: FF }}>
      {/* Back button */}
      <div style={{ paddingTop: 16, paddingLeft: 20, paddingRight: 20, marginBottom: 8 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={20} strokeWidth={1.8} color="#2B2420" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", fontFamily: FF }}>Back</span>
        </button>
      </div>

      {/* Title */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 4 }}>
        <h1 style={{ fontFamily: "'Pragmatica', 'Inter', 'Helvetica Neue', Helvetica, sans-serif", fontSize: 52, fontWeight: 400, lineHeight: 0.95, letterSpacing: "-0.01em", color: "#020202", margin: 0 }}>
          How Can We Help?
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 24 }}>
        <p style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.35, color: "rgba(18,18,20,0.55)", fontStyle: "italic", margin: 0, fontFamily: FF }}>
          Find answers to the most common questions about Hello Hoedspruit
        </p>
      </div>

      {/* Search */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.1)", borderRadius: 14, padding: "12px 16px", gap: 10 }}>
          <Search size={20} strokeWidth={1.8} color="rgba(18,18,20,0.35)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, background: "transparent", outline: "none", border: "none", fontSize: 15, fontWeight: 400, color: "#2b2420", fontFamily: FF }}
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ paddingLeft: 20, paddingRight: 20 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: 24 }}>
              <Skeleton className="h-3 w-32 mb-3" />
              <Skeleton className="h-40 w-full rounded-[16px]" />
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && filteredSections.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 48 }}>
          <p style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.4)", fontFamily: FF }}>No matching questions found.</p>
        </div>
      )}

      {/* FAQ sections */}
      {!isLoading && filteredSections.map((section) => (
        <div key={section.title} style={{ paddingLeft: 20, paddingRight: 20 }}>
          {/* Section overline */}
          <h3 style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(18,18,20,0.4)", lineHeight: 1.3, marginTop: 8, marginBottom: 12, fontFamily: FF }}>
            {section.title}
          </h3>
          {/* Card */}
          <div style={{ background: "#FFFFFF", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, padding: "4px 0", overflow: "hidden", marginBottom: 16 }}>
            {section.items.map((item, i) => {
              const isOpen = openItem === item.id;
              return (
                <div key={item.id}>
                  {i > 0 && <div style={{ height: 1, background: "rgba(18,18,20,0.08)" }} />}
                  <button
                    onClick={() => toggleItem(item.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", padding: "16px 20px", background: "none", border: "none", cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 500, color: "#2B2420", lineHeight: 1.35, flex: 1, paddingRight: 12, fontFamily: FF }}>
                      {item.question}
                    </span>
                    <ChevronDown
                      size={20}
                      strokeWidth={1.8}
                      color="rgba(18,18,20,0.25)"
                      style={{
                        flexShrink: 0,
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 20px 16px 20px" }}>
                      <p style={{ fontSize: 15, fontWeight: 400, color: "rgba(18,18,20,0.55)", lineHeight: 1.5, margin: 0, fontFamily: FF }}>
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* CTA card */}
      {!isLoading && (
        <div style={{ paddingLeft: 20, paddingRight: 20, marginTop: 16, marginBottom: 36 }}>
          <div style={{ background: "#1A1A1A", borderRadius: 16, padding: "28px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 160, height: 160, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h3 style={{ fontSize: 22, fontWeight: 400, color: "#FFFFFF", textTransform: "uppercase", lineHeight: 1.15, letterSpacing: "0.01em", marginBottom: 8, margin: 0, marginBlockEnd: 8, fontFamily: FF }}>
                Still Have a Question?
              </h3>
              <p style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.4, color: "rgba(255,255,255,0.55)", fontStyle: "italic", marginBottom: 20, margin: 0, marginBlockEnd: 20, fontFamily: FF }}>
                We're happy to help. Get in touch and we'll get back to you as soon as we can.
              </p>
              <Link
                to="/contact"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#FFFFFF", color: "#1A1A1A", borderRadius: 24, padding: "12px 20px", textDecoration: "none", fontSize: 15, fontWeight: 600, fontFamily: FF, transition: "transform 0.12s ease, opacity 0.12s ease" }}
                onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                Contact Us
                <ArrowRight size={16} strokeWidth={1.8} color="#1A1A1A" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQs;
