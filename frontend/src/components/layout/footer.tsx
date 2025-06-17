// src/components/layout/Footer.tsx
import Link from 'next/link';
import { Scale, Twitter, Github, FileText } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Features', href: '/#features' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'How it Works', href: '/#how-it-works' },
    ],
    legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
    developers: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/docs/API.md' },
      { label: 'Smart Contract', href: 'https://github.com/Vastav1812' },
    ],
    community: [
      { label: 'Discord', href: 'https://discord.gg/ra2111003010093_vastav' },
      { label: 'Twitter', href: 'https://twitter.com/AICourtBot' },
      { label: 'GitHub', href: 'https://github.com/Vastav1812' },
    ],
  };

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold">AI Court</span>
            </div>
            <p className="text-gray-400 text-sm">
              Decentralized justice for the AI ecosystem.
            </p>
            <div className="flex gap-4 mt-4">
              <Link href="https://twitter.com/AICourtBot" className="text-gray-400 hover:text-white">
                <Twitter size={20} />
              </Link>
              <Link href="https://github.com/Vastav1812" className="text-gray-400 hover:text-white">
                <Github size={20} />
              </Link>
              <Link href="/docs" className="text-gray-400 hover:text-white">
                <FileText size={20} />
              </Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Developers</h3>
            <ul className="space-y-2">
              {footerLinks.developers.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-400 text-sm">
            © {currentYear} AI Court. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}