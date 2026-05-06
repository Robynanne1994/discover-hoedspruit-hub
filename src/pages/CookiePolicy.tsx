import PolicyPageLayout from "@/components/PolicyPageLayout";

const sections = [
  { heading: "What Are Cookies", body: "Cookies are small text files stored on your device when you use a website or app. They help remember your preferences, improve performance and provide a better experience." },
  { heading: "How We Use Cookies", body: "Hello Hoedspruit uses cookies and similar technologies for the following purposes:\n- Essential cookies: these are necessary for the app to function correctly, including keeping you logged in and remembering your session\n- Analytics cookies: these help us understand how users interact with the app so we can improve features and performance\n- Preference cookies: these remember your settings and choices to personalise your experience" },
  { heading: "Third-Party Cookies", body: "Some features of the app may use third-party services (such as analytics providers or embedded content) that set their own cookies. We do not control these cookies. Please refer to the relevant third party's cookie policy for more information." },
  { heading: "Managing Cookies", body: "You can manage or disable cookies through your device settings or browser preferences. Please note that disabling certain cookies may affect the functionality of the app." },
  { heading: "Your Consent", body: "In accordance with South Africa's POPIA and the Electronic Communications and Transactions Act, we will obtain your consent before placing non-essential cookies on your device. You can withdraw your consent at any time by adjusting your settings." },
  { heading: "Changes to This Policy", body: "We may update this Cookie Policy from time to time. Changes will be reflected on this page with an updated date." },
  { heading: "Contact", body: "If you have questions about our use of cookies, contact us at admin@hellohoedspruit.co." },
];

const CookiePolicy = () => (
  <PolicyPageLayout title="Cookie Policy" lastUpdated="Last updated: April 2026" sections={sections} />
);

export default CookiePolicy;
