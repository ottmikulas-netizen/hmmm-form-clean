import { Metadata } from "next";

export const metadata: Metadata = {
  title: "hmmm. by PB — tvůj večer s Petrem",
  description: "Private dining brief od Petra Bíny.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
