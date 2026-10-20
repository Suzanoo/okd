import type { Metadata } from "next";
import AppHeader from "./_components/AppHeader"; // server wrapper
import ThemeProvider from "./_providers/ThemeProvider";
import BoqSessionProvider from "./_providers/BoqSessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "OKd",
  description: "Project control center",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  var preference = 'system';
  try { var saved = localStorage.getItem('okmd_theme_mode'); if (saved === 'light' || saved === 'dark') preference = saved; } catch (e) {}
  var dark = preference === 'dark' || (preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <BoqSessionProvider>
          <AppHeader />
          <div id="workspace-content" tabIndex={-1}>{children}</div>
          </BoqSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
