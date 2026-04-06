import PolicyPageLayout from "@/components/PolicyPageLayout";

const sections = [
  { heading: "Agreement to Terms", body: "By downloading, accessing or using Hello Hoedspruit, you agree to be bound by these Terms of Use. If you do not agree, please do not use the app. These terms apply to all visitors, users and others who access or use the app." },
  { heading: "Who We Are", body: "Hello Hoedspruit is a local directory and lifestyle app for Hoedspruit, South Africa. It is operated by Robyn Dawes. For any questions about these terms, contact us at hellohoedspruit@gmail.com." },
  { heading: "Use of the App", body: "You may use Hello Hoedspruit for personal, non-commercial purposes. You agree not to:\n- Use the app for any unlawful purpose\n- Attempt to gain unauthorised access to any part of the app\n- Copy, modify, distribute or reproduce any content from the app without permission\n- Use the app to harass, abuse or harm other users\n- Submit false, misleading or inaccurate information\n- Use automated tools to scrape, crawl or extract data from the app" },
  { heading: "Accounts", body: "Some features of the app require you to create an account. You are responsible for maintaining the confidentiality of your account details and for all activity that occurs under your account. You must provide accurate and complete information when creating your account. We reserve the right to suspend or terminate accounts that violate these terms." },
  { heading: "Content and Listings", body: "Hello Hoedspruit provides business listings, event information and community content for informational purposes. While we take care to ensure accuracy, we do not guarantee that all information is complete, current or error-free. Business details such as opening hours, prices and contact information are subject to change without notice. We recommend confirming details directly with the business before visiting." },
  { heading: "User Content", body: "By submitting content to the app (including profile information, comments, feedback and listing enquiries), you grant Hello Hoedspruit a non-exclusive, royalty-free, worldwide licence to use, display and distribute that content within the app. You are responsible for the content you submit and must not post anything that is offensive, defamatory, infringing or otherwise unlawful." },
  { heading: "Intellectual Property", body: "The app, including its design, features, content and branding, is owned by Hello Hoedspruit and protected by South African intellectual property laws. You may not reproduce, distribute or create derivative works from any part of the app without our prior written consent." },
  { heading: "Third-Party Links", body: "The app may contain links to third-party websites, Google Maps, Google Business Profiles, WhatsApp and other external services. We are not responsible for the content, accuracy or practices of these external services. Accessing them is at your own risk." },
  { heading: "Limitation of Liability", body: "To the fullest extent permitted by South African law, Hello Hoedspruit and its owner shall not be liable for any indirect, incidental, special, consequential or punitive damages arising from your use of the app. This includes but is not limited to loss of data, loss of profits or damage resulting from reliance on information provided through the app." },
  { heading: "Disclaimer", body: 'The app is provided on an "as is" and "as available" basis. We make no warranties or representations about the accuracy or completeness of the app\'s content. We do not guarantee that the app will be uninterrupted, secure or error-free.' },
  { heading: "Termination", body: "We may suspend or terminate your access to the app at any time, without notice, for conduct that we believe violates these terms or is harmful to other users, us or third parties. Upon termination, your right to use the app ceases immediately." },
  { heading: "Changes to These Terms", body: "We may update these Terms of Use from time to time. If we make significant changes, we will notify users through the app. Continued use of the app after changes are posted constitutes acceptance of the updated terms." },
  { heading: "Governing Law", body: "These terms are governed by the laws of the Republic of South Africa. Any disputes arising from these terms or your use of the app shall be subject to the jurisdiction of the South African courts." },
  { heading: "Contact", body: "If you have questions about these terms, please contact us at hellohoedspruit@gmail.com." },
];

const TermsOfUse = () => (
  <PolicyPageLayout title="Terms of Use" lastUpdated="Last updated: April 2026" sections={sections} />
);

export default TermsOfUse;
