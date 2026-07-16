import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "漫步地球｜從所在之處出發",
  description: "輸入任意經緯度，在真實地理資料生成的世界中漫步。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
