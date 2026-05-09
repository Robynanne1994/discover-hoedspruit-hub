import { LegalPage, Section, P, List, Em, A } from "@/components/legal/LegalPage";

const EMAIL = "hellohoedspruit@gmail.com";

const TermsOfUse = () => (
  <LegalPage
    title="terms of use."
    footer="That's the legal bit. If anything's unclear, drop us a line. We'd rather you ask than guess."
  >
    <Section heading="agreement to terms">
      <P>
        By using the Hello Hoedspruit app, you agree to these terms. If you don't agree with any part of them, please don't use the app. These terms apply to everyone who visits, browses, or uses the service in any way.
      </P>
    </Section>

    <Section heading="who we are">
      <P>
        Hello Hoedspruit is a local guide to the town of Hoedspruit and the surrounding area, run by <Em>Sammy</Em> and a small team. We're based in South Africa and we make this app for the community we live in.
      </P>
    </Section>

    <Section heading="use of the app">
      <P>
        You may use the app for personal, non-commercial purposes. You agree not to misuse the service, attempt to access it in any way other than the interface we provide, or use it to do anything unlawful.
      </P>
    </Section>

    <Section heading="accounts">
      <P>
        Some features require an account. You're responsible for keeping your login details safe and for everything that happens under your account. If you think someone else is using your account, let us know.
      </P>
    </Section>

    <Section heading="content & listings">
      <P>
        We do our best to keep listings, opening hours, contact details, and event information accurate, but the world changes faster than we can. Always confirm important details directly with the business or organiser before you rely on them.
      </P>
    </Section>

    <Section heading="user content">
      <P>
        If you submit reviews, comments, suggestions, or other content to the app, you grant us a non-exclusive, royalty-free licence to use, display, and adapt that content within the app. You're responsible for what you post, and you agree not to submit anything unlawful, defamatory, or infringing.
      </P>
    </Section>

    <Section heading="intellectual property">
      <P>
        The app, its design, written content, photography, and the Hello Hoedspruit name and logo belong to us or to the people we've licensed them from. You're welcome to enjoy the app, but please don't copy, reproduce, or republish parts of it without our permission.
      </P>
    </Section>

    <Section heading="third-party links">
      <P>
        The app links to outside websites, social profiles, and booking platforms. We don't control those sites and we're not responsible for their content, privacy practices, or anything that happens once you leave us.
      </P>
    </Section>

    <Section heading="limitation of liability">
      <P>
        To the fullest extent allowed by law, Hello Hoedspruit, its team, and contributors aren't liable for any indirect, incidental, or consequential damages arising from your use of the app, including lost profits, missed bookings, or anything that goes wrong on a trip planned around our content.
      </P>
    </Section>

    <Section heading="disclaimer">
      <P>
        The app is provided <Em>"as is"</Em> and <Em>"as available"</Em>. We make no warranties about completeness, accuracy, reliability, or suitability for a particular purpose. Use it as a helpful guide, not as the final word.
      </P>
    </Section>

    <Section heading="termination">
      <P>
        We may suspend or end your access to the app at any time, with or without notice, if we believe you've broken these terms or are using the service in a way that harms other users or the platform.
      </P>
    </Section>

    <Section heading="changes to these terms">
      <P>
        We may update these terms from time to time. When we do, we'll change the date at the top of this page. Continued use of the app after changes are posted means you accept the updated terms.
      </P>
    </Section>

    <Section heading="governing law">
      <P>
        These terms are governed by the laws of the Republic of South Africa. Any dispute arising out of or relating to the app will be handled by the courts of South Africa.
      </P>
    </Section>

    <Section heading="contact">
      <P last>
        Questions, complaints, or anything in between, write to us at <A href={`mailto:${EMAIL}`}>{EMAIL}</A>.
      </P>
    </Section>
  </LegalPage>
);

export default TermsOfUse;
