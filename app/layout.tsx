import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amplitude session sync",
  description: "Prototype: server-owned Amplitude session id",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
