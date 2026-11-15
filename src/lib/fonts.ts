import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";

// Display: page titles and a few large figures only.
export const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"]
});

// Body: every label, control, table and paragraph.
export const bodyFont = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"]
});
