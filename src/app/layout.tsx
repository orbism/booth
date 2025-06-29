// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getThemeSettings } from "@/lib/theme-loader";
import { generateThemeCssOverrides } from "@/lib/theme-css-injector";
import { ToastProvider } from "@/context/ToastContext";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import { SubscriptionProvider } from "@/components/providers/SubscriptionProvider";
// import Navbar from "@/components/layouts/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const themeSettings = await getThemeSettings();
   
  return {
    title: `${themeSettings?.companyName || 'Bureau of Internet Culture'} - Photo Booth App`,
    description: "Photo Booth Software",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeSettings = await getThemeSettings();
  
  // Generate comprehensive CSS overrides
  const themeStyles = themeSettings ? 
    generateThemeCssOverrides(themeSettings) : '';

  return (
    <html lang="en">
      <head>
        {themeSettings && (
          <style id="theme-overrides" dangerouslySetInnerHTML={{ 
            __html: themeStyles
          }} />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProviderWrapper>
          <SubscriptionProvider>
            <ToastProvider>
              {/* <Navbar /> */}
              {children}
            </ToastProvider>
          </SubscriptionProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}