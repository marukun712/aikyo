import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Header from "@/components/ui/header";
import Sidebar from "@/components/ui/sidebar";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "MRTalk",
  description: "MRTalkで、あなたの部屋をにぎやかに",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/beercss@3.11.33/dist/cdn/beer.min.css"
          rel="stylesheet"
        />
        <Script
          type="module"
          src="https://cdn.jsdelivr.net/npm/beercss@3.11.33/dist/cdn/beer.min.js"
        ></Script>
        <Script
          type="module"
          src="https://cdn.jsdelivr.net/npm/material-dynamic-colors@1.1.2/dist/cdn/material-dynamic-colors.min.js"
        ></Script>
      </head>
      <body className={notoSansJp.variable}>
        <Header />
        <Sidebar />
        <main className="responsive">{children}</main>
      </body>
    </html>
  );
}
