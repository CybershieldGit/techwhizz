import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://techwhizz.onrender.com"),
  title: {
    default: "OmniFlow BPO | Enterprise Real-Time Chat & Dispatch Suite",
    template: "%s | OmniFlow BPO"
  },
  description: "High-performance enterprise BPO customer chat and dispatch suite with zero-latency WebSocket broadcasting, multi-device agent routing, and MongoDB Atlas persistence.",
  keywords: [
    "BPO",
    "OmniFlow",
    "Customer Support",
    "Live Chat",
    "Dispatch Engine",
    "Helpdesk",
    "Real-Time Chat",
    "Support Operations"
  ],
  authors: [{ name: "OmniFlow Technologies" }],
  creator: "OmniFlow Team",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" }
    ]
  },
  openGraph: {
    title: "OmniFlow BPO — Enterprise Real-Time Support Suite",
    description: "Instant parallel customer dispatch, mobile & desktop synchronization, and MongoDB Atlas audit logs.",
    url: "https://techwhizz.onrender.com",
    siteName: "OmniFlow BPO",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "OmniFlow BPO Shield Logo"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "OmniFlow BPO | Real-Time Chat & Dispatch",
    description: "Instant parallel customer broadcast and live agent dispatch suite.",
    images: ["/android-chrome-512x512.png"]
  }
};

export const viewport = {
  themeColor: "#1b3b8b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
