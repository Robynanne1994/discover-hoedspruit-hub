import { LegalPage, Section, P, List, Em, A } from "@/components/legal/LegalPage";

const EMAIL = "hellohoedspruit@gmail.com";

const ContentGuidelines = () => (
  <LegalPage
    title="community guidelines."
    footer="Be kind. Be useful. Be a good local. That's basically the lot."
  >
    <Section heading="be respectful">
      <P>
        Hello Hoedspruit is a small town's app, and small towns work because people treat each other well. Disagreements are fine. Personal attacks, harassment, slurs, and discrimination of any kind are not.
      </P>
    </Section>

    <Section heading="keep it honest">
      <P>
        If you leave a review or share information about a place, make sure it's true and based on your own experience. Don't post fake reviews, don't pretend to be someone you're not, and don't try to game the system to push a business up or knock one down.
      </P>
    </Section>

    <Section heading="stay on topic">
      <P>
        This is a guide to Hoedspruit and the surrounding area. Keep your posts, reviews, and submissions relevant to local places, events, and community life. Off-topic or unrelated content may be removed.
      </P>
    </Section>

    <Section heading="no spam or self-promotion">
      <P last>To keep the app useful for everyone, please don't:</P>
      <List
        items={[
          "Post the same content repeatedly across listings, events, or reviews.",
          "Use reviews or comments to promote your own business or services.",
          "Share affiliate links, referral codes, or unrelated marketing material.",
          "Create multiple accounts to influence ratings, follows, or visibility.",
        ]}
      />
    </Section>

    <Section heading="no illegal content">
      <P>
        Don't post anything that's illegal under South African law, infringes someone else's rights, or encourages others to break the law. This includes hate speech, threats, sexual content involving minors, and content that promotes violence.
      </P>
    </Section>

    <Section heading="reporting & enforcement">
      <P>
        If you see something that breaks these guidelines, report it through the app or email us. We review reports as quickly as we can and may remove content, warn users, or suspend accounts depending on what we find. Serious or repeated breaches can lead to a permanent ban.
      </P>
    </Section>

    <Section heading="contact">
      <P last>
        To report content or ask about these guidelines, write to us at <A href={`mailto:${EMAIL}`}>{EMAIL}</A>.
      </P>
    </Section>
  </LegalPage>
);

export default ContentGuidelines;
