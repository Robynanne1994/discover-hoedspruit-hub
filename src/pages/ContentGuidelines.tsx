import PolicyPageLayout from "@/components/PolicyPageLayout";

const sections = [
  { heading: "Our Standards", body: "Hello Hoedspruit is a community space for locals and visitors to discover and share information about Hoedspruit. These guidelines set out what is and is not acceptable when contributing content to the app." },
  { heading: "What We Expect", body: "All content shared on Hello Hoedspruit should be:\n- Accurate and honest: share information that is truthful and based on genuine experience\n- Respectful: treat other users, business owners and the community with courtesy\n- Relevant: content should relate to Hoedspruit, its businesses, events and community\n- Original: only share content that you have the right to share" },
  { heading: "What Is Not Allowed", body: "The following types of content are not permitted:\n- Hate speech, discrimination or harassment of any kind\n- Threats, intimidation or bullying\n- False, misleading or deliberately inaccurate information about businesses or individuals\n- Spam, advertising or promotional content not related to a legitimate listing\n- Content that is sexually explicit, obscene or inappropriate\n- Content that infringes on anyone's intellectual property, privacy or other rights\n- Personal information about others shared without their consent\n- Content that promotes illegal activity" },
  { heading: "Business Listings", body: "Business owners and listing contributors should ensure that all information provided is accurate and current. If details change, please update the listing or contact us. We reserve the right to edit, remove or reject listing content that does not meet these guidelines or that we believe is misleading." },
  { heading: "Events", body: "Event submissions should include accurate dates, times, venues and descriptions. Events that have been cancelled or postponed should be updated promptly. We reserve the right to remove events that contain misleading information or that do not meet these guidelines." },
  { heading: "Moderation", body: "Hello Hoedspruit reserves the right to review, edit or remove any content that violates these guidelines without prior notice. We may also suspend or terminate accounts that repeatedly violate these standards." },
  { heading: "Reporting Content", body: "If you come across content that you believe violates these guidelines, please report it to us at admin@hellohoedspruit.co or use the Give Us Feedback feature in the app. We take all reports seriously and will review them as quickly as possible." },
  { heading: "Changes to These Guidelines", body: "We may update these Content Guidelines from time to time. Changes will be reflected on this page with an updated date." },
  { heading: "Contact", body: "If you have questions about these guidelines, contact us at admin@hellohoedspruit.co." },
];

const ContentGuidelines = () => (
  <PolicyPageLayout title="Content Guidelines" lastUpdated="Last updated: April 2026" sections={sections} />
);

export default ContentGuidelines;
