import React from 'react';
import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import ClientWrapper from "@/components/ClientWrapper";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic", "normal"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Bodh — AI Study Assistant",
  description: "Bodh is an AI-powered study assistant for Indian college students. Generate summaries and quizzes instantly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${dmSans.variable} ${playfair.variable} font-sans selection:bg-indigo-500/30`}>
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
