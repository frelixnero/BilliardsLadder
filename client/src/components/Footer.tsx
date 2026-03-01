import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-green-900/20 border-t border-green-700/30 py-8 mt-16">
      <div className="container mx-auto px-4 text-center">
        <p className="text-green-500 text-sm">
          © 2025 Action Ladder Billiards. Dark. Gritty. Competitive.
        </p>
        <p className="text-green-600 text-xs mt-2">
          Built for hustlers, by hustlers.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
