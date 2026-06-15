import { Helmet } from "react-helmet-async";

const SITE = "https://hello-hoedspruit-hub.lovable.app";

interface SeoProps {
  title: string;
  description: string;
  path: string; // route path, e.g. "/about" or "/listing/abc"
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  jsonLd?: object | object[];
}

/**
 * Per-route head tags. Sets a unique title (<60 chars recommended),
 * description (50–160 chars), self-referencing canonical, and og:url.
 */
export default function Seo({
  title,
  description,
  path,
  image,
  noIndex,
  type = "website",
  jsonLd,
}: SeoProps) {
  const url = `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
  const safeTitle = title.length > 60 ? title.slice(0, 57).trimEnd() + "…" : title;
  const safeDesc =
    description.length > 160 ? description.slice(0, 157).trimEnd() + "…" : description;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDesc} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      {image ? <meta property="og:image" content={image} /> : null}
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDesc} />
      {image ? <meta name="twitter:image" content={image} /> : null}
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : null}
      {ldArray.map((obj, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(obj)}</script>
      ))}
    </Helmet>
  );
}
