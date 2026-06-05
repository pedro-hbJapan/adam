import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adam - 社内統合プラットフォーム",
  description: "Adam v0.1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
