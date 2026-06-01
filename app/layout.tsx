import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "note follower roadmap",
  description: "noteフォロワー目標達成までの行動ロードマップ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
