import { LegalPage, Section, P, List, Em, A } from "@/components/legal/LegalPage";

const EMAIL = "admin@hellohoedspruit.co";

const ContentGuidelines = () => (
  <LegalPage
    title="Community Guidelines"
    lastUpdated="15 June 2026"
    
  >
    <Section heading="Be Respectful">
      <P>
        Hello Hoedspruit is a small town's app, and small towns work because people treat each other well. Disagreements are fine. Personal attacks, harassment, slurs and discrimination of any kind are not.
      </P>
    </Section>

    <Section heading="Keep it Honest">
      <P>
        If you leave a review or share information about a place, make sure it is true and based on your own experience. Do not post fake reviews, do not pretend to be someone you are not and do not try to game the system to push a business up or knock one down.
      </P>
    </Section>

    <Section heading="Stay on Topic">
      <P>
        This is a guide to Hoedspruit and the surrounding area. Keep your posts, reviews and submissions relevant to local places, events and community life. Off-topic or unrelated content may be removed.
      </P>
    </Section>

    <Section heading="No Spam or Self-Promotion">
      <P last>To keep the app useful for everyone, please do not:</P>
      <List
        items={[
          "Post the same content repeatedly across listings, events or reviews.",
          "Use reviews or comments to promote your own business or services.",
          "Share affiliate links, referral codes or unrelated marketing material.",
          "Create multiple accounts to influence ratings, follows or visibility.",
        ]}
      />
    </Section>

    <Section heading="No Illegal Content">
      <P>
        Do not post anything that is illegal under South African law, infringes someone else's rights or encourages others to break the law. This includes hate speech, threats, sexual content involving minors and content that promotes violence.
      </P>
    </Section>

    <Section heading="Reporting & Enforcement">
      <P>
        If you see something that breaks these guidelines, report it through the app or email us. We review reports as quickly as we can and may remove content, warn users or suspend accounts depending on what we find. Serious or repeated breaches can lead to a permanent ban.
      </P>
    </Section>

    <Section heading="Contact">
      <P last>
        To report content or ask about these guidelines, email us at <A href={`mailto:${EMAIL}`}>{EMAIL}</A>.
      </P>
    </Section>
  </LegalPage>
);

export default ContentGuidelines;
