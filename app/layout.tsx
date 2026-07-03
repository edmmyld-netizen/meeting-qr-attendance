import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meeting QR Attendance System",
  description: "QR Code based meeting attendance — Government of Tamil Nadu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('mqa_theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
