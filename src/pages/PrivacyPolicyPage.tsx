import { LegalPage, Section, P, List, Em, A } from "@/components/legal/LegalPage";

const EMAIL = "admin@hellohoedspruit.co";

const PrivacyPolicyPage = () => (
  <LegalPage
    title="privacy policy."
    footer="Your data is yours. We treat it the way we'd want ours treated. Questions welcome."
  >
    <Section heading="information we collect">
      <P>
        When you use Hello Hoedspruit, we collect a small amount of information needed to make the app work. This includes the details you give us when you sign up, the actions you take inside the app, and basic technical data sent by your device.
      </P>
      <P last>The kinds of information we collect include:</P>
      <List
        items={[
          "Account details such as your name, email address, and profile photo if you choose to add one.",
          "Activity inside the app, including the listings, events, and specials you save or visit.",
          "Device and usage data such as your device type, operating system, and approximate location.",
          "Anything you choose to send us through feedback forms, contact forms, or business enquiries.",
        ]}
      />
    </Section>

    <Section heading="how we use your information">
      <P>
        We use your information to run the app, save your favourites across devices, recommend places that fit what you're into, respond to your messages, and improve the service over time. We don't use your data to build profiles for advertising, and we don't sell it to anyone.
      </P>
    </Section>

    <Section heading="data sharing">
      <P last>We share information only when we genuinely need to:</P>
      <List
        items={[
          "With trusted service providers who help us run the app, such as hosting and authentication.",
          "When required by law, a court order, or a legitimate request from a public authority.",
          "To protect the rights, safety, or property of Hello Hoedspruit, our users, or the public.",
        ]}
      />
    </Section>

    <Section heading="cookies & tracking">
      <P>
        We use a small number of cookies and similar technologies to keep you signed in, remember your preferences, and understand how the app is used. You can read more in our <A href="/cookie-policy">Cookie Policy</A>.
      </P>
    </Section>

    <Section heading="your rights">
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

    <Section heading="data security">
      <P>
        We take reasonable steps to protect your information against loss, misuse, and unauthorised access. No system is perfect, but we treat your data the way we'd want ours treated, and we work with reputable providers who do the same.
      </P>
    </Section>

    <Section heading="children's privacy">
      <P>
        The app isn't aimed at children under the age of 13, and we don't knowingly collect personal information from them. If you believe a child has given us information, please contact us and we'll remove it.
      </P>
    </Section>

    <Section heading="changes to this policy">
      <P>
        We may update this policy from time to time. When we do, we'll change the date at the top of this page. If the changes are significant, we'll let you know inside the app.
      </P>
    </Section>

    <Section heading="contact">
      <P last>
        For privacy questions or to exercise any of your rights, email us at <A href={`mailto:${EMAIL}`}>{EMAIL}</A>.
      </P>
    </Section>
  </LegalPage>
);

export default PrivacyPolicyPage;
