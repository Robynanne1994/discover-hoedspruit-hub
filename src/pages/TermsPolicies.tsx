import { Link } from "react-router-dom";
import BackButton from "@/components/BackButton";
import BottomNav from "@/components/BottomNav";
import {
  FileText,
  Shield,
  Cookie,
  BookOpen,
  ChevronRight,
} from "lucide-react";

const policyRows = [
  {
    icon: FileText,
    label: "Terms of Use",
    sub: "Our terms governing your use of Hello Hoedspruit",
    href: "/terms/use",
  },
  {
    icon: Shield,
    label: "Privacy Policy",
    sub: "How we collect, use, and protect your data",
    href: "/terms/privacy",
  },
  {
    icon: Cookie,
    label: "Cookie Policy",
    sub: "How we use cookies on the Hello Hoedspruit app",
    href: "/terms/cookies",
  },
  {
    icon: BookOpen,
    label: "Content Guidelines",
    sub: "Our standards for what is shared in the community",
    href: "/terms/content",
  },
];

const TermsPolicies = () => {
  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Top bar */}
      <div className="pt-14 pb-1 px-5 relative">
        <div className="absolute left-5 top-14">
          <BackButton className="text-primary mb-0" />
        </div>
        <h1 className="text-center text-[13px] font-medium text-muted-foreground uppercase tracking-[0.08em]">
          Terms & Policies
        </h1>
      </div>

      {/* Intro */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-[13px] text-muted-foreground leading-relaxed text-center">
          Review the policies that govern your experience on Hello Hoedspruit.
        </p>
      </div>

      {/* Policy list */}
      <div className="px-5 mt-4">
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
          {policyRows.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} to={item.href}>
                <div
                  className={`flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/20 transition-colors ${
                    i < policyRows.length - 1
                      ? "border-b border-border/20"
                      : ""
                  }`}
                >
                  <Icon
                    className="h-[16px] w-[16px] text-primary/70 shrink-0"
                    strokeWidth={1.5}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-foreground block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      {item.sub}
                    </span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TermsPolicies;
