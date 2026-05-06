import BackButton from "@/components/BackButton";
import BottomNav from "@/components/BottomNav";

const sections = [
  {
    title: "1. Information We Collect",
    content: `When you use Hello Hoedspruit, we may collect the following types of information:

• **Personal information** you provide when creating an account, such as your name, email address, and profile photo.
• **Usage data** including pages visited, searches performed, listings saved, and interactions within the app.
• **Device information** such as your browser type, operating system, and screen resolution.
• **Location data** if you grant permission, to provide relevant local recommendations and directions.

We only collect information that is necessary to deliver and improve your experience on the platform.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information we collect to:

• Provide, maintain, and improve the Hello Hoedspruit platform.
• Personalise your experience, including tailored recommendations and search results.
• Communicate with you about updates, features, and community activity.
• Monitor and analyse usage trends to enhance performance and usability.
• Protect the security and integrity of the platform.

We will never sell your personal information to third parties.`,
  },
  {
    title: "3. Sharing of Information",
    content: `We may share your information in the following limited circumstances:

• **Service providers** — trusted partners who help us operate the platform (e.g. hosting, analytics). They are bound by confidentiality agreements.
• **Legal requirements** — when required by law, regulation, or legal process.
• **Safety and protection** — to protect the rights, property, or safety of Hello Hoedspruit, our users, or the public.
• **With your consent** — when you explicitly agree to share information, such as making your profile public.

We do not share your data with advertisers for targeting purposes.`,
  },
  {
    title: "4. Data Storage & Security",
    content: `Your data is stored securely using industry-standard encryption and access controls. We use trusted cloud infrastructure to host our services and take reasonable measures to protect your information from unauthorised access, loss, or misuse.

While no system is completely secure, we are committed to safeguarding your data and continuously improving our security practices.`,
  },
  {
    title: "5. Cookies & Tracking",
    content: `Hello Hoedspruit uses cookies and similar technologies to:

• Keep you signed in across sessions.
• Remember your preferences and settings.
• Understand how the app is used so we can improve it.

You can manage your cookie preferences through your browser settings. For more details, please review our Cookie Policy.`,
  },
  {
    title: "6. Your Rights",
    content: `Depending on your location, you may have the right to:

• **Access** the personal data we hold about you.
• **Correct** inaccurate or incomplete information.
• **Delete** your account and associated data.
• **Withdraw consent** for data processing where applicable.
• **Export** your data in a portable format.

To exercise any of these rights, please contact us using the details below.`,
  },
  {
    title: "7. Children's Privacy",
    content: `Hello Hoedspruit is not intended for children under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child under 13 has provided us with personal data, we will take steps to delete that information promptly.`,
  },
  {
    title: "8. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we make significant changes, we will notify you through the app or via email.

We encourage you to review this policy periodically to stay informed about how we protect your data.`,
  },
  {
    title: "9. Contact Us",
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:

• **Email:** admin@hellohoedspruit.co
• **In-app:** Visit the Help & Support section in your Account Settings.

We aim to respond to all enquiries within 48 hours.`,
  },
];

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Top bar */}
      <div className="pt-14 pb-1 px-6 relative">
        <div className="absolute left-6 top-14">
          <BackButton />
        </div>
        <h1 className="text-center text-[13px] font-medium text-muted-foreground tracking-[0.08em]">
          Privacy Policy
        </h1>
      </div>

      {/* Intro */}
      <div className="px-6 pt-6 pb-4">
        <p className="text-[13px] text-muted-foreground leading-relaxed text-center">
          Last updated: 1 April 2026
        </p>
        <p className="text-[13px] text-muted-foreground leading-relaxed text-center mt-2">
          Your privacy matters to us. This policy explains how Hello Hoedspruit
          collects, uses, and protects your personal information.
        </p>
      </div>

      {/* Sections */}
      <div className="px-6 space-y-4 mt-2">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-card border border-border/40 rounded-xl px-4 py-4"
          >
            <h2 className="text-[13px] font-semibold text-foreground mb-2 leading-tight font-sans">
              {section.title}
            </h2>
            <div className="text-[12px] text-muted-foreground leading-[1.7] whitespace-pre-line prose-strong:text-foreground prose-strong:font-medium">
              {section.content.split("**").map((part, i) =>
                i % 2 === 1 ? (
                  <strong key={i} className="text-foreground font-medium">
                    {part}
                  </strong>
                ) : (
                  <span key={i} className="font-sans">{part}</span>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 mt-6 mb-4">
        <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
          © {new Date().getFullYear()} Hello Hoedspruit. All rights reserved.
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default PrivacyPolicy;
