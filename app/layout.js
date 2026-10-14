import "./globals.css";

export const metadata = {
  title: "OmniFlow BPO | Real-Time Chat & Support Dispatch System",
  description: "Next.js real-time chat BPO platform with parallel team broadcast and first-to-claim agent routing.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
