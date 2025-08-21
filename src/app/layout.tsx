import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Should I Touch Grass?",
  description: "Should I Touch Grass?",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <body>{children}</body>
    </html>
  );
}
