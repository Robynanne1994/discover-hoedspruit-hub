import { LegalPage, Section, P, List, Em, A } from "@/components/legal/LegalPage";

const EMAIL = "admin@hellohoedspruit.co";

const CookiePolicy = () => (
  <LegalPage
    title="Cookie Policy"
    lastUpdated="15 June 2026"
    
  >
    <Section heading="What Are Cookies">
      <P>
        Cookies are small text files placed on your device when you visit a website or app. They help the service remember things about you, like whether you are signed in or what you have looked at, so it does not have to ask you the same question every time.
      </P>
    </Section>

    <Section heading="How We Use Cookies">
      <P last>We use cookies and similar technologies for a few practical reasons:</P>
      <List
        items={[
          "To keep you signed in to your account between visits.",
          "To remember your preferences, like which tabs you last opened on the saved page.",
          "To understand how the app is used so we can make it better.",
          "To keep the service secure and detect unusual activity.",
        ]}
      />
    </Section>

    <Section heading="Third-Party Cookies">
      <P>
        Some cookies are set by third parties we work with, such as our authentication and analytics providers. These providers have their own privacy policies, and we only use ones we trust to handle your data with the same care we do.
      </P>
    </Section>

    <Section heading="Managing Your Preferences">
      <P>
        Most browsers and devices let you control cookies through their settings. You can block them, delete them or be warned before one is set. Keep in mind that turning off cookies may break parts of the app, like staying signed in.
      </P>
    </Section>

    <Section heading="Changes to This Policy">
      <P>
        We may update this policy from time to time. When we do, we will change the date at the top of this page. Continued use of the app after changes are posted means you accept the updated policy.
      </P>
    </Section>

    <Section heading="Contact">
      <P last>
        Questions about cookies or anything else on this page, email us at <A href={`mailto:${EMAIL}`}>{EMAIL}</A>.
      </P>
    </Section>
  </LegalPage>
);

export default CookiePolicy;
