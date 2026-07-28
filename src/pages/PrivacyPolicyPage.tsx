import { LegalPage, Section, P, List, A } from "@/components/legal/LegalPage";

const EMAIL = "admin@hellohoedspruit.co";

const PrivacyPolicyPage = () => (
  <LegalPage
    title="Privacy Policy"
    lastUpdated="28 July 2026"
  >
    <Section heading="Who We Are">
      <P>
        Hello Hoedspruit is operated by Robyn Anne Dawes, based in Hoedspruit, Limpopo, South Africa, 1380. We are the "responsible party" for your personal information under the Protection of Personal Information Act, 2013 (POPIA), and this policy explains what we collect, why, and the rights you have.
      </P>
    </Section>

    <Section heading="Information We Collect">
      <P>
        When you use Hello Hoedspruit, we collect the information needed to make the app work. Some of it you give us directly, and some is generated as you use the app.
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
        We use your information to run the app, save your favourites across devices, power the social features you choose to use, send you the notifications you have switched on, respond to your messages, and improve the service over time. We rely on the following legal grounds: performing our agreement with you when you create an account, your consent for things like notifications and your profile photo, and our legitimate interest in keeping the app secure and working properly.
      </P>
      <P>
        We do not use your data to build advertising profiles and we do not sell it to anyone. We will not send you direct marketing by email or SMS unless you have expressly agreed to it, and you can withdraw that agreement at any time.
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

    <Section heading="Cross-Border Transfers">
      <P>
        Our service providers store and process information on servers located outside South Africa. Where that happens, the provider is bound by contract and by data protection rules that protect your information to a standard similar to POPIA, as section 72 of POPIA requires.
      </P>
    </Section>

    <Section heading="How Long We Keep Your Information">
      <P>
        We keep your personal information for as long as your account is active. If you delete your account, your personal information is deleted along with it, and any copies held in system backups are removed within 30 days. Information sent through contact or feedback forms is kept only as long as needed to deal with your message.
      </P>
    </Section>

    <Section heading="Cookies & Tracking">
      <P>
        We use a small number of cookies and similar technologies to keep you signed in, remember your preferences and keep the service secure. You can read more in our <A href="/cookie-policy">Cookie Policy</A>.
      </P>
    </Section>

    <Section heading="Your Rights">
      <P last>Under POPIA you have the right to:</P>
      <List
        items={[
          "Ask for a copy of the personal information we hold about you.",
          "Correct anything that is inaccurate or out of date.",
          "Ask us to delete your account and the data tied to it.",
          "Object to or restrict certain ways we use your information.",
          <span key="regulator">Complain to the Information Regulator at <A href="https://inforegulator.org.za">inforegulator.org.za</A>; 010 023 5200 or toll free 0800 017 160.</span>,
          <span key="exercise">To exercise any of these rights, email us at <A href={`mailto:${EMAIL}`}>{EMAIL}</A>. We will respond as soon as we reasonably can, and at the latest within 30 days.</span>,
        ]}
      />
    </Section>

    <Section heading="Data Security">
      <P>
        We take reasonable steps to protect your information against loss, misuse and unauthorised access. No system is perfect, but we treat your data the way we would want ours treated, and we work with reputable providers who do the same. If a security compromise ever affects your personal information, we will notify you and the Information Regulator as POPIA requires.
      </P>
    </Section>

    <Section heading="Children's Privacy">
      <P>
        Under POPIA, a child is anyone under the age of 18. The app is not aimed at children, and users under 18 may only use it with the consent of a parent or guardian. We do not knowingly collect personal information from a child without that consent. If you believe a child has given us information, please contact us and we will remove it.
      </P>
    </Section>

    <Section heading="Changes to This Policy">
      <P>
        We may update this policy from time to time. When we do, we will change the date at the top of this page. If the changes are significant, we will let you know inside the app.
      </P>
    </Section>

    <Section heading="Contact">
      <P last>
        For privacy questions or to exercise any of your rights, please email us at <A href={`mailto:${EMAIL}`}>{EMAIL}</A> or write to us at Robyn Anne Dawes, Hoedspruit, Limpopo, South Africa, 1380.
      </P>
    </Section>
  </LegalPage>
);

export default PrivacyPolicyPage;
