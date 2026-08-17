import { Poppins, Noto_Sans_Bengali } from "next/font/google";

export const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  // Only the weights actually used in the UI — fewer font files = faster load.
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  display: "swap",
});

export const fontVariables = `${poppins.variable} ${notoBengali.variable}`;
