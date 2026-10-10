import { Ubuntu } from 'next/font/google';
import Image from 'next/image';
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
          <Image className="fish fish-yellow" src="/fish1.png" alt="" width={64} height={64} />
          <Image className="fish fish-coral" src="/fish2.png" alt="" width={64} height={64} />
          <Image className="fish fish-blue" src="/fish3.png" alt="" width={64} height={64} />
          <div className="seafloor" />
        </div>
        <main className="site-content">{children}</main>
      </body>
    </html>
  );
}
