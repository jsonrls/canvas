import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const displayFont = Inter({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: {
    default: "BoardPrep Canvas",
    template: "%s · BoardPrep Canvas",
  },
  description:
    "A focused, collaborative study canvas for board exam preparation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>{children}</body>
    </html>
  );
}
