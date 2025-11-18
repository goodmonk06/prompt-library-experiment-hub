import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Prompt Library & Experiment Hub',
  description: 'Manage prompts, versions, and experiments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <Link href="/" className="text-xl font-bold text-blue-600">
                  Prompt Hub
                </Link>
                <nav className="flex space-x-6">
                  <Link href="/projects" className="text-gray-600 hover:text-gray-900">
                    Projects
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
          </main>
          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-gray-500 text-sm">
              Prompt Library & Experiment Hub
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
