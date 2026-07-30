import type { Metadata } from "next";
import "@/app/globals.css";
import { bodyFont, displayFont } from "@/lib/fonts";

export const metadata: Metadata = {
  title: {
    default: "UnitPulse",
    template: "%s · UnitPulse"
  },
  description: "Turn out-of-scope requests into approved, paid work."
};

const themeScript = `
  try {
    const saved = localStorage.getItem("unitpulse-theme");
    const theme = saved === "light" || saved === "dark"
      ? saved
      : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {}
`;

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
