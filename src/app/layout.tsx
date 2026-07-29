import type { Metadata } from "next";
import "@/app/globals.css";
import { bodyFont, displayFont } from "@/lib/fonts";

export const metadata: Metadata = {
  title: {
    default: "MarginGuard",
    template: "%s · MarginGuard"
  },
  description: "Turn out-of-scope requests into approved, paid work."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
