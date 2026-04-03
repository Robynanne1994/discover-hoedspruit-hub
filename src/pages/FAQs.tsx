import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, HelpCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqSections = [
  {
    title: "About Hello Hoedspruit",
    items: [
      {
        q: "What is Hello Hoedspruit?",
        a: "Hello Hoedspruit is a local town guide app for Hoedspruit, South Africa. It brings together restaurants, accommodation, activities, shopping, events and community info all in one place. It's built by a local, for locals and visitors alike.",
      },
      {
        q: "Who is behind Hello Hoedspruit?",
        a: "Hello Hoedspruit was created by Robyn Dawes, a lifelong Hoedspruit resident. She built the app because there was no single place where people could find everything our town has to offer.",
      },
      {
        q: "Is the app free to use?",
        a: "Yes. Hello Hoedspruit is completely free to download and use.",
      },
    ],
  },
  {
    title: "Using the App",
    items: [
      {
        q: "How do I find a specific business?",
        a: "You can use the search bar on the Home or Explore pages, or browse by category to find what you're looking for.",
      },
      {
        q: "Can I save listings to view later?",
        a: "Yes. Tap the Save button on any listing to add it to your Saved Listings. You can find all your saved places from your Profile.",
      },
      {
        q: 'What does "Visited" mean?',
        a: "Visited lets you keep track of places you've actually been to. It's separate from Saved, so you can save a place you want to try and mark it as visited once you've been.",
      },
      {
        q: "How do I find events in Hoedspruit?",
        a: "Head to the Events tab at the bottom of the app. You can filter by Today, This Week, Upcoming or Past to find what's on.",
      },
    ],
  },
  {
    title: "Listings & Information",
    items: [
      {
        q: "How are businesses chosen for listing?",
        a: "We aim to include as many Hoedspruit businesses and services as possible. Listings are researched and added by the Hello Hoedspruit team, and business owners can also get in touch to be listed.",
      },
      {
        q: "Is the information accurate?",
        a: "We do our best to keep everything up to date, but details like opening hours, prices and contact info can change. If you spot something that needs updating, please let us know through the Contact page.",
      },
      {
        q: "Why are some listings missing details?",
        a: "Not all businesses have a website, email or full set of details available online. We'd rather leave a field blank than guess. If you're a business owner and want to add or update your info, get in touch.",
      },
    ],
  },
  {
    title: "For Business Owners",
    items: [
      {
        q: "How do I get my business listed?",
        a: "Visit the Advertise page in the app or contact us directly. We'll get your listing set up with the details you provide.",
      },
      {
        q: "Can I update my listing details?",
        a: "Absolutely. Just reach out to us via the Contact page with your updated info and we'll make the changes.",
      },
      {
        q: "Can I be featured or advertise?",
        a: "Yes. We offer featured listing and advertising options. Visit the Advertise page for more details or get in touch to discuss what would work best for your business.",
      },
    ],
  },
  {
    title: "Account & Privacy",
    items: [
      {
        q: "Do I need an account to use the app?",
        a: "You can browse listings and events without an account. Creating an account lets you save listings, mark places as visited, save events and follow other users.",
      },
      {
        q: "How is my data handled?",
        a: "We take your privacy seriously. You can read our full Privacy Policy from the Terms and Policies section in your Profile settings.",
      },
      {
        q: "How do I delete my account?",
        a: "You can manage your account from the Account Settings page, or contact us for help.",
      },
    ],
  },
  {
    title: "General",
    items: [
      {
        q: "First time in Hoedspruit. Where do I start?",
        a: "Start with the Explore page to browse categories like Restaurants, Activities and Accommodation. Check the Events page to see what's on during your visit. And save anything that catches your eye so you can find it again easily.",
      },
      {
        q: "How do I report a problem or give feedback?",
        a: "We'd love to hear from you. Use the Contact page in the app to get in touch, whether it's a bug, a suggestion or just a hello.",
      },
    ],
  },
];

const FAQs = () => {
  const [search, setSearch] = useState("");

  const filteredSections = useMemo(() => {
    if (!search.trim()) return faqSections;
    const q = search.toLowerCase();
    return faqSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.q.toLowerCase().includes(q) ||
            item.a.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [search]);

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Top bar */}
      <div className="pt-14 pb-1 px-5 relative">
        <div className="absolute left-5 top-14">
          <BackButton className="text-primary mb-0" />
        </div>
        <h1 className="text-center text-[13px] font-medium text-muted-foreground uppercase tracking-[0.08em]">
          FAQs
        </h1>
      </div>

      {/* Hero */}
      <div className="px-5 pt-8 pb-5 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <h2
          className="text-[22px] font-semibold text-foreground tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          How can we help?
        </h2>
        <p className="text-muted-foreground text-[13px] leading-relaxed mt-2 max-w-[280px] mx-auto">
          Find answers to the most common questions about Hello Hoedspruit.
        </p>
      </div>

      {/* Search */}
      <div className="px-5 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/60 bg-card text-sm text-foreground placeholder:text-muted-foreground/50 placeholder:italic focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* FAQ sections */}
      <div className="px-5 space-y-6">
        {filteredSections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-[13px]">
              No matching questions found.
            </p>
          </div>
        )}

        {filteredSections.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.1em] mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
              <Accordion type="single" collapsible>
                {section.items.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`${section.title}-${i}`}
                    className={
                      i < section.items.length - 1
                        ? "border-b border-border/20"
                        : "border-b-0"
                    }
                  >
                    <AccordionTrigger className="px-4 py-3.5 text-[13px] font-medium text-foreground hover:no-underline text-left gap-3">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0 text-[12.5px] text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        ))}
      </div>

      {/* CTA card */}
      <div className="px-5 mt-8">
        <div className="rounded-2xl bg-primary/8 px-6 py-6 border border-border/40 text-center">
          <h3
            className="text-lg font-semibold text-foreground tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Still have a question?
          </h3>
          <p className="text-muted-foreground text-[12.5px] leading-relaxed mt-1.5 mb-4 max-w-[260px] mx-auto">
            We're happy to help. Get in touch and we'll get back to you as soon
            as we can.
          </p>
          <Link to="/contact">
            <Button className="rounded-full px-6 text-[13px] font-medium">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQs;
