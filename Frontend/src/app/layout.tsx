import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gharpay CRM — Lead Management",
  description: "Enterprise Lead Management CRM powered by Gharpay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} h-screen bg-slate-50 flex overflow-hidden`}>
        <Providers>
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
              {children}
            </main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#0f1117",
                color: "#f1f5f9",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 500,
                boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
                padding: "10px 14px",
              },
              success: {
                iconTheme: {
                  primary: "#34d399",
                  secondary: "#0f1117",
                },
              },
              error: {
                iconTheme: {
                  primary: "#f87171",
                  secondary: "#0f1117",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
