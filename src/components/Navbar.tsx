import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, User, Search, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false);
  const exploreRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, signOut } = useAuth();

  const { data: categories } = useQuery({
    queryKey: ["nav-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) {
        setExploreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const otherLinks = [
    { label: "Events", href: "#events" },
    { label: "Advertise", href: "#advertise" },
    { label: "About", href: "#about" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container-wide px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-heading text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Discover <span className="text-primary">Hoedspruit</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {/* Explore dropdown */}
            <div ref={exploreRef} className="relative">
              <button
                onClick={() => setExploreOpen(!exploreOpen)}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium transition-colors text-sm tracking-wide uppercase"
              >
                Explore
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${exploreOpen ? "rotate-180" : ""}`} />
              </button>

              {exploreOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 bg-card border border-border rounded-lg shadow-lg py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {categories?.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.id}`}
                      className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                      onClick={() => setExploreOpen(false)}
                    >
                      {cat.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {otherLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-muted-foreground hover:text-foreground font-medium transition-colors text-sm tracking-wide uppercase">
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Search className="h-5 w-5" />
            </Button>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-2 text-primary">
                  <Shield className="h-4 w-4" /> Admin
                </Button>
              </Link>
            )}
            {user ? (
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" /> Sign In
                </Button>
              </Link>
            )}
          </div>

          <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-6 space-y-1">
            {/* Mobile Explore accordion */}
            <button
              onClick={() => setMobileExploreOpen(!mobileExploreOpen)}
              className="flex items-center justify-between w-full py-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Explore
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileExploreOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileExploreOpen && (
              <div className="pl-4 space-y-1 pb-2">
                {categories?.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.id}`}
                    className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => { setIsOpen(false); setMobileExploreOpen(false); }}
                  >
                    {cat.title}
                  </Link>
                ))}
              </div>
            )}

            {otherLinks.map((link) => (
              <a key={link.label} href={link.href} className="block py-2 text-muted-foreground hover:text-foreground font-medium transition-colors" onClick={() => setIsOpen(false)}>
                {link.label}
              </a>
            ))}
            {isAdmin && (
              <Link to="/admin" className="block py-2 text-primary font-medium" onClick={() => setIsOpen(false)}>
                Admin Dashboard
              </Link>
            )}
            {user ? (
              <Button variant="outline" size="sm" className="w-full mt-3" onClick={signOut}>Sign Out</Button>
            ) : (
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="outline" size="sm" className="gap-2 w-full mt-3">
                  <User className="h-4 w-4" /> Sign In
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
