import { Ubuntu } from 'next/font/google';
import "./globals.css";

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-ubuntu',
});

export const metadata = {
  title: "Blue Current",
  description: "A bright underwater investing dashboard.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${ubuntu.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="ocean-scene" aria-hidden="true">
          <div className="sunbeams" />
          <div className="bubble bubble-one" />
          <div className="bubble bubble-two" />
          <div className="bubble bubble-three" />
          <div className="bubble bubble-four" />
          <div className="fish fish-yellow" />
          <div className="fish fish-coral" />
          <div className="fish fish-blue" />
          <div className="seafloor" />
        </div>
        <main className="site-content">{children}</main>
      </body>
    </html>
  );
}
