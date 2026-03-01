import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center py-8 border-b border-green-700/30">
      <div className="neon-glow">
        <h1 className="text-4xl font-bold text-green-400 mb-2">
          ACTIONLADDER BILLIARDS
        </h1>
        <p className="text-green-500 text-lg">
          Pool. Points. Pride. Money.
        </p>
      </div>
    </header>
  );
};

export default Header;
