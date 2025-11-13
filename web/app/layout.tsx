import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NoteMind AI - Your AI-Powered Research Companion",
  description: "Upload documents, ask questions, and get intelligent insights powered by Google Gemini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased font-sans bg-gray-900 text-white">
        {children}
      </body>
    </html>
  );
}
