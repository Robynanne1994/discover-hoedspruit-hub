import { LegalPage, Section, P, List, Em, A } from "@/components/legal/LegalPage";

const EMAIL = "admin@hellohoedspruit.co";

const PrivacyPolicyPage = () => (
  <LegalPage
    title="Privacy Policy"
    lastUpdated="15 June 2026"
    footer="Your data is yours. We treat it the way we'd want ours treated. Questions welcome."
  >
    <Section heading="Information We Collect">
      <P>
        When you use Hello Hoedspruit, we collect a small amount of information needed to make the app work. This includes the details you give us when you sign up, the actions you take inside the app and basic technical data sent by your device.
      </P>
      <P last>The kinds of information we collect include:</P>
      <List
        items={[
          "Account details such as your name, email address and profile photo if you choose to add one.",
          "Activity inside the app, including the listings, events and specials you save or visit.",
          "Device and usage data such as your device type, operating system and approximate location.",
          "Anything you choose to send us through feedback forms, contact forms or business enquiries.",
        ]}
      />
    </Section>

    <Section heading="How We Use Your Information">
      <P>
        We use your information to run the app, save your favourites across devices, recommend places that fit what you are into, respond to your messages, and improve the service over time. We do not use your data to build profiles for advertising and we do not sell it to anyone.
      </P>
    </Section>

    <Section heading="Data Sharing">
      <P last>We share information only when we genuinely need to:</P>
      <List
        items={[
          "With trusted service providers who help us run the app, such as hosting and authentication.",
          "When required by law, a court order or a legitimate request from a public authority.",
          "To protect the rights, safety or property of Hello Hoedspruit, our users or the public.",
        ]}
      />
    </Section>

    <Section heading="Cookies & Tracking">
      <P>
        We use a small number of cookies and similar technologies to keep you signed in, remember your preferences and understand how the app is used. You can read more in our <A href="/cookie-policy">Cookie Policy</A>.
      </P>
    </Section>

    <Section heading="Your Rights">
      <P last>You have the right to:</P>
      <List
        items={[
          "Ask for a copy of the personal information we hold about you.",
          "Correct anything that's inaccurate or out of date.",
          "Ask us to delete your account and the data tied to it.",
          "Object to or restrict certain ways we use your information.",
        ]}
      />
    </Section>

    <Section heading="Data Security">
      <P>
        We take reasonable steps to protect your information against loss, misuse, and unauthorised access. No system is perfect, but we treat your data the way we would want ours treated, and we work with reputable providers who do the same.
      </P>
    </Section>

    <Section heading="Children's Privacy">
      <P>
        The app is not aimed at children under the age of 13, and we do not knowingly collect personal information from them. If you believe a child has given us information, please contact us and we will remove it.
      </P>
    </Section>

    <Section heading="Changes to This Policy">
      <P>
        We may update this policy from time to time. When we do, we will change the date at the top of this page. If the changes are significant, we will let you know inside the app.
      </P>
    </Section>

    <Section heading="Contact">
      <P last>
        For privacy questions or to exercise any of your rights around privacy, please email us at <A href={`mailto:${EMAIL}`}>{EMAIL}</A>.
      </P>
    </Section>
  </LegalPage>
);

export default PrivacyPolicyPage;
