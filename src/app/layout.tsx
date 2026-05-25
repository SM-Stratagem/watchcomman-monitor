import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_NAME = "Watchcomman Monitor";
const DESCRIPTION =
  "A premium global monitoring surface for live disease intelligence — unifying Ebola, hantavirus, and environmental signals into a single editorial dashboard.";

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Global Monitoring Intelligence`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "SM Stratagem" }],
  creator: "SM Stratagem",
  publisher: "SM Stratagem",
  keywords: [
    "global monitoring",
    "disease surveillance",
    "ebola monitor",
    "hantavirus monitor",
    "outbreak intelligence",
    "live dashboard",
    "3D globe monitoring",
  ],
  formatDetection: { telephone: false },
  openGraph: {
    title: `${SITE_NAME} — Global Monitoring Intelligence`,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Global Monitoring Intelligence`,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#04060c",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
