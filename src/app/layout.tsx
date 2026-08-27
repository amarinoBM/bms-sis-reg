import type { Metadata } from "next";
import { Poppins } from "next/font/google";

import { AppToaster } from "@/app/_components/app-shell";
import { cn } from "@/lib/utils";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "BMS Student Registration",
  description: "Parent registration for Brilliant Microschools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", poppins.variable)}>
      <body className="antialiased">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
