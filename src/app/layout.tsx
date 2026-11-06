import { Theme } from "@astryxdesign/core/theme";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";

import { ToastProvider } from "@/components/ui/toast";

import { qollabWorkshopTheme } from "../../theme/generated/qollab-workshop.js";

import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-qollab-body",
});

const headingFont = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-qollab-heading",
});

const codeFont = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-qollab-code",
});

export const metadata: Metadata = {
  title: {
    default: "Qollab",
    template: "%s · Qollab",
  },
  description:
    "A focused, collaborative study canvas for board exam preparation.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${headingFont.variable} ${codeFont.variable}`}
      data-astryx-theme="qollab-workshop"
      data-scroll-behavior="smooth"
      data-theme="light"
    >
      <body>
        <Theme theme={qollabWorkshopTheme} mode="light">
          <ToastProvider>{children}</ToastProvider>
        </Theme>
      </body>
    </html>
  );
}
