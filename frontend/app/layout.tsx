import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOMI — Student's Own Mentor Intelligence",
  description: "Mama explains. Kitty asks. You pass.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="version" content="1.1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ivory font-sans antialiased">
        {children}
        {/* Nuke any rogue service workers and clear old caches */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  regs.forEach(function(r) { r.unregister(); });
                });
              }
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  names.forEach(function(n) { caches.delete(n); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
