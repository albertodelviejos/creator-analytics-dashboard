import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Creator Analytics",
  description: "Multi-platform analytics dashboard for content creators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased font-[family-name:var(--font-geist-sans)]">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 pl-60">
            <div className="p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
