import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata = {
  title: "Mohammed Shaaz - AI / Full-Stack Engineer",
  description: "Chat with Shaaz's AI Representative. Factual information grounding based on resumes and GitHub repositories.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#080810] text-[#f0f0ff] font-sans selection:bg-[#6366F1]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
