import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOMI — Student's Own Mentor Intelligence",
  description: "Mama explains. You pass.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="version" content="1.2.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ivory font-sans antialiased">
        {children}
        {/* Nuke ALL service workers, clear ALL caches, force fresh load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var CURRENT_VERSION = '1.2.0';
                var needsReload = false;

                // 1. Unregister every service worker
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var i = 0; i < regs.length; i++) {
                      regs[i].unregister();
                      needsReload = true;
                    }
                    // 2. Delete every cache in CacheStorage
                    if ('caches' in window) {
                      caches.keys().then(function(names) {
                        var p = [];
                        for (var j = 0; j < names.length; j++) {
                          p.push(caches.delete(names[j]));
                        }
                        Promise.all(p).then(function() {
                          // 3. If we killed a SW, reload once to escape its fetch handler
                          if (needsReload) {
                            window.location.reload();
                          }
                        });
                      });
                    } else if (needsReload) {
                      window.location.reload();
                    }
                  });
                }

                // 4. Version gate — if browser has old version cached, hard reload
                try {
                  var lastVersion = localStorage.getItem('somi_app_version');
                  if (lastVersion && lastVersion !== CURRENT_VERSION) {
                    localStorage.setItem('somi_app_version', CURRENT_VERSION);
                    window.location.reload();
                  }
                  localStorage.setItem('somi_app_version', CURRENT_VERSION);
                } catch(e) {}
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
