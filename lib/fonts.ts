import { Poppins, Noto_Sans_Bengali, Plus_Jakarta_Sans, Inter } from "next/font/google";

export const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  // Only the weights actually used in the UI — fewer font files = faster load.
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  display: "swap",
});

export const fontVariables = `${poppins.variable} ${jakarta.variable} ${inter.variable} ${notoBengali.variable}`;
