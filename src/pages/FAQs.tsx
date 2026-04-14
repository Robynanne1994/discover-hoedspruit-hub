import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, ChevronDown, ArrowLeft, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="min-h-screen" style={{ background: "#ffffff" }}>
      {/* Back button */}
      <div style={{ paddingTop: 44, paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} className="flex items-center" style={{ gap: 6 }}>
          <ArrowLeft style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.4)" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(18,18,20,0.4)", letterSpacing: "0.2px" }}>Back</span>
        </button>
      </div>

      {/* Heading */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 40, lineHeight: 0.95, letterSpacing: "-0.5px", color: "#2b2420", textTransform: "uppercase" }}>
          HOW CAN WE<br />HELP?
        </h1>
      </div>

      {/* Subtitle */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 24 }}>
        <p style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: "italic", fontSize: 14, color: "rgba(18,18,20,0.4)", letterSpacing: "0.2px", lineHeight: 1.4 }}>
          Find answers to the most common questions about Hello Hoedspruit
        </p>
      </div>

      {/* Search */}
      <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
        <div className="flex items-center" style={{ background: "rgba(18,18,20,0.04)", border: "1px solid rgba(18,18,20,0.08)", borderRadius: 14, padding: "14px 16px", gap: 10 }}>
          <Search style={{ width: 18, height: 18, strokeWidth: 2, color: "rgba(18,18,20,0.3)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 14, color: "#2b2420", letterSpacing: "0.2px" }}
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ paddingLeft: 24, paddingRight: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              <Skeleton className="h-3 w-32 mb-3.5" />
              <Skeleton className="h-40 w-full rounded-[16px]" />
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && filteredSections.length === 0 && (
        <div className="text-center" style={{ paddingTop: 48 }}>
          <p style={{ fontSize: 14, color: "rgba(18,18,20,0.4)" }}>No matching questions found.</p>
        </div>
      )}

      {/* FAQ sections */}
      {!isLoading && filteredSections.map((section) => (
        <div key={section.title} style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 28 }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: "rgba(18,18,20,0.3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14 }}>
            {section.title}
          </h3>
          <div style={{ background: "rgba(18,18,20,0.03)", border: "1px solid rgba(18,18,20,0.06)", borderRadius: 16, overflow: "hidden" }}>
            {section.items.map((item, i) => {
              const isOpen = openItem === item.id;
              return (
                <div key={item.id} style={{ borderBottom: i < section.items.length - 1 ? "1px solid rgba(18,18,20,0.06)" : "none" }}>
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-center justify-between text-left"
                    style={{ padding: 16 }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#2b2420", lineHeight: 1.3, flex: 1, paddingRight: 12 }}>
                      {item.question}
                    </span>
                    <ChevronDown
                      style={{
                        width: 16, height: 16, strokeWidth: 2, color: "rgba(18,18,20,0.25)", flexShrink: 0,
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 16px 16px 16px", marginTop: -6 }}>
                      <p style={{ fontSize: 14, color: "rgba(18,18,20,0.5)", lineHeight: 1.7, marginTop: 10 }}>
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
        <div style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 100 }}>
          <div style={{ background: "#121214", borderRadius: 20, padding: "32px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />
            <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.04)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h3 style={{ fontWeight: 900, fontSize: 20, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.3px", lineHeight: 1.1, marginBottom: 10 }}>
                STILL HAVE A QUESTION?
              </h3>
              <p style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: "italic", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, marginBottom: 22 }}>
                We're happy to help. Get in touch and we'll get back to you as soon as we can.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center"
                style={{ background: "#ffffff", borderRadius: 10, padding: "12px 22px", gap: 8 }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: "#2b2420", letterSpacing: "0.3px" }}>Contact Us</span>
                <ArrowUpRight style={{ width: 14, height: 14, color: "#2b2420", strokeWidth: 2.5 }} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQs;
