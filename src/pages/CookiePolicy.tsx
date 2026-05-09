import { LegalPage, Section, P, List, Em, A } from "@/components/legal/LegalPage";

const EMAIL = "admin@hellohoedspruit.co";

const CookiePolicy = () => (
  <LegalPage
    title="cookie policy."
    footer="We use cookies, but only the polite ones. Tap below if you'd like to know more."
  >
    <Section heading="what are cookies">
      <P>
        Cookies are small text files placed on your device when you visit a website or app. They help the service remember things about you, like whether you're signed in or what you've looked at, so it doesn't have to ask you the same question every time.
      </P>
    </Section>

    <Section heading="how we use cookies">
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

    <Section heading="third-party cookies">
      <P>
        Some cookies are set by third parties we work with, such as our authentication and analytics providers. These providers have their own privacy policies, and we only use ones we trust to handle your data with the same care we do.
      </P>
    </Section>

    <Section heading="managing your preferences">
      <P>
        Most browsers and devices let you control cookies through their settings. You can block them, delete them, or be warned before one is set. Keep in mind that turning off cookies may break parts of the app, like staying signed in.
      </P>
    </Section>

    <Section heading="changes to this policy">
      <P>
        We may update this policy from time to time. When we do, we'll change the date at the top of this page. Continued use of the app after changes are posted means you accept the updated policy.
      </P>
    </Section>

    <Section heading="contact">
      <P last>
        Questions about cookies or anything else on this page, write to us at <A href={`mailto:${EMAIL}`}>{EMAIL}</A>.
      </P>
    </Section>
  </LegalPage>
);

export default CookiePolicy;
