import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "404: Key Not Found",
  description: "404: Key Not Found – a coding adventure treasure hunt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#05070f] text-slate-100">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(12, 18, 32, 0.95)",
              border: "1px solid rgba(0, 240, 255, 0.35)",
              color: "#e2e8f0",
              fontWeight: 600,
            },
          }}
        />
      </body>
    </html>
  );
}
