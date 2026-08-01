import { Barlow_Condensed, Source_Sans_3 } from "next/font/google";

export const displayFont = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"]
});

export const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"]
});
