// The auth emails, rendered here rather than by the provider.
//
// Supabase's own templating is fine, but it lives in the dashboard: it has to
// be pasted in by hand, it drifts from the repo, and a project that has never
// had it pasted sends the stock link-only email — which is exactly the state
// that made the app ask for a six-digit code the email did not contain.
// Rendering here means the templates ship with the code and are always the ones
// that go out.
//
// Everything below is shaped by one goal: the message has to reach an ordinary
// Gmail inbox without a warning banner.
//
//   * The code is the message. It is plain text, in the subject line and in the
//     body. A spam filter can disable every link in an email — it cannot
//     disable six digits, and the app only ever asks for the digits.
//   * One link, at most, and it is optional. Auth links are a redirector on a
//     shared domain carrying an opaque token, which is the exact shape of a
//     phishing redirect. Leading with the code means the email still works when
//     the link is stripped.
//   * A real plain-text alternative always accompanies the HTML. HTML-only mail
//     is one of the oldest and strongest spam signals there is.
//   * No images, no tracking pixel, no web fonts, no external CSS. Nothing to
//     fetch means nothing to distrust, and it renders the same everywhere.
//   * Tables and inline styles only — mail clients strip stylesheets and have
//     never supported flexbox.

/** The auth events we send mail for. */
export type AuthEmailAction =
  | "signup"
  | "recovery"
  | "email_change"
  | "magiclink"
  | "invite"
  | "reauthentication";

export interface AuthEmailInput {
  action: AuthEmailAction;
  /** The six-digit code the app asks for. */
  token: string;
  /** The one-tap alternative, or null to render no link at all. */
  confirmationUrl: string | null;
  /** How long the code stays valid. Mirrors `otp_expiry`. */
  ttlMinutes: number;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const BRAND = "Hello Hoedspruit";
const SUPPORT_EMAIL = "hello@hellohoedspruit.co";

/** Palette, matching the app and the templates in supabase/templates/. */
const CREAM = "#E6E0CC";
const INK = "#1A1A1A";
const MUTED = "#6B6255";
const FAINT = "#9C9387";
const ACCENT = "#423324";
const LINK = "#715a3d";
const CODE_BG = "#F6F1E4";

const SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const DISPLAY = "'Nohemi','Helvetica Neue',Helvetica,Arial,sans-serif";

/**
 * Escape anything interpolated into the HTML.
 *
 * The token and URL come from Supabase rather than from a user, so this is
 * belt-and-braces — but an auth email is the last place to rely on a value
 * being well-formed because it usually is.
 */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface Copy {
  subject: string;
  heading: string;
  intro: string;
  /** Reassurance for someone who did not ask for this email. */
  ignore: string;
  /** Label above the optional one-tap link. */
  linkLead: string;
}

function copyFor(action: AuthEmailAction, token: string): Copy {
  switch (action) {
    case "recovery":
      return {
        subject: `${token} is your ${BRAND} password reset code`,
        heading: "Reset your password",
        intro:
          "Enter this code in the app to choose a new password. We'll never ask you for it by phone or message.",
        ignore:
          "Didn't ask to reset your password? You can safely ignore this email — your password stays as it is.",
        linkLead: "Reading this on the same device? You can reset in one tap instead:",
      };
    case "email_change":
      return {
        subject: `${token} is your ${BRAND} email confirmation code`,
        heading: "Confirm your new email",
        intro:
          "Enter this code in the app to finish moving your account to this address. Until you do, your account keeps its current email.",
        ignore:
          "Didn't ask to change your email? You can safely ignore this email — nothing will change.",
        linkLead: "Reading this on the same device? You can confirm in one tap instead:",
      };
    case "magiclink":
      return {
        subject: `${token} is your ${BRAND} sign in code`,
        heading: "Sign in to Hello Hoedspruit",
        intro: "Enter this code in the app to sign in. We'll never ask you for it by phone or message.",
        ignore: "Didn't try to sign in? You can safely ignore this email — nobody gets in without this code.",
        linkLead: "Reading this on the same device? You can sign in in one tap instead:",
      };
    case "reauthentication":
      return {
        subject: `${token} is your ${BRAND} confirmation code`,
        heading: "Confirm it's you",
        intro: "Enter this code in the app to confirm this change to your account.",
        ignore: "Didn't ask for this? You can safely ignore this email — nothing will change.",
        linkLead: "",
      };
    case "invite":
      return {
        subject: `${token} is your ${BRAND} invitation code`,
        heading: "You've been invited",
        intro: "Enter this code in the app to set up your account.",
        ignore: "Not expecting an invitation? You can safely ignore this email.",
        linkLead: "Reading this on the same device? You can accept in one tap instead:",
      };
    case "signup":
    default:
      return {
        subject: `${token} is your ${BRAND} verification code`,
        heading: "Confirm your email",
        intro:
          "Welcome to the Lowveld. Enter this code in the app to finish setting up your account.",
        ignore:
          "Didn't sign up? You can safely ignore this email — no account will be activated without this code.",
        linkLead: "Reading this on the same device? You can confirm in one tap instead:",
      };
  }
}

function renderHtml(copy: Copy, input: AuthEmailInput): string {
  const { token, confirmationUrl, ttlMinutes } = input;
  const link =
    confirmationUrl && copy.linkLead
      ? `
            <hr style="border:none;border-top:1px solid rgba(26,26,26,0.10);margin:24px 0 16px;" />
            <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.55;color:${FAINT};">
              ${esc(copy.linkLead)}
              <br />
              <a href="${esc(confirmationUrl)}" style="color:${LINK};text-decoration:underline;word-break:break-all;">${esc(confirmationUrl)}</a>
            </p>`
      : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREAM};margin:0;padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;">
        <tr>
          <td align="center" style="padding:0 8px 20px;font-family:${DISPLAY};font-size:20px;font-weight:600;letter-spacing:0.01em;color:${ACCENT};">
            ${BRAND}
          </td>
        </tr>
        <tr>
          <td style="background:#FFFFFF;border-radius:20px;padding:32px 28px;">
            <h1 style="margin:0 0 12px;font-family:${DISPLAY};font-size:22px;font-weight:600;line-height:1.25;letter-spacing:-0.2px;color:${INK};">
              ${esc(copy.heading)}
            </h1>
            <p style="margin:0 0 20px;font-family:${SANS};font-size:14px;line-height:1.55;color:${MUTED};">
              ${esc(copy.intro)}
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="padding:4px 0 20px;">
                  <div style="background:${CODE_BG};border-radius:16px;padding:18px 12px;font-family:${SANS};font-size:32px;font-weight:700;letter-spacing:0.28em;text-indent:0.28em;color:${INK};">
                    ${esc(token)}
                  </div>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 16px;font-family:${SANS};font-size:13px;line-height:1.55;color:${MUTED};">
              The code works for <strong style="color:${INK};font-weight:600;">${ttlMinutes} minutes</strong>
              and can only be used once. If it has expired, ask for a new one from the app.
            </p>
            <p style="margin:0 0 8px;font-family:${SANS};font-size:13px;line-height:1.55;color:${MUTED};">
              ${esc(copy.ignore)}
            </p>${link}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 8px 0;font-family:${SANS};font-size:12px;line-height:1.55;color:${MUTED};">
            Your Lowveld local &middot; ${BRAND}
            <br />
            Questions? Reply to this email or write to ${SUPPORT_EMAIL}.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

function renderText(copy: Copy, input: AuthEmailInput): string {
  const { token, confirmationUrl, ttlMinutes } = input;
  const lines = [
    BRAND,
    "",
    copy.heading,
    "",
    copy.intro,
    "",
    `Your code: ${token}`,
    "",
    `The code works for ${ttlMinutes} minutes and can only be used once.`,
    `If it has expired, ask for a new one from the app.`,
    "",
    copy.ignore,
  ];
  if (confirmationUrl && copy.linkLead) {
    lines.push("", copy.linkLead, confirmationUrl);
  }
  lines.push("", "—", `Your Lowveld local · ${BRAND}`, `Questions? Reply to this email or write to ${SUPPORT_EMAIL}.`);
  return lines.join("\n");
}

/** Render the subject, HTML and plain-text parts for one auth email. */
export function renderAuthEmail(input: AuthEmailInput): RenderedEmail {
  const copy = copyFor(input.action, input.token);
  return {
    subject: copy.subject,
    html: renderHtml(copy, input),
    text: renderText(copy, input),
  };
}
