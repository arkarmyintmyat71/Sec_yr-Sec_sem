// app/layout.js
// Root layout: wraps every page with the HTML shell, font, and global styles.

import "./globals.css";

export const metadata = {
  title: "Employee Management System",
  description: "Manage your team with ease",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Import Sora font from Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
