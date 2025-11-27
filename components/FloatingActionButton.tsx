import React from 'react';
import { PlusIcon } from './Icons';

interface FloatingActionButtonProps {
  onClick: () => void;
  isMobileNavVisible: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick, isMobileNavVisible }) => {
  // Adjusted bottom position to account for the taller floating dock + padding
  const bottomClass = isMobileNavVisible ? 'bottom-28' : 'bottom-6';

  return (
    <div className={`fixed ${bottomClass} md:bottom-8 right-6 z-40 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]`}>
      <button
        onClick={onClick}
        className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-xl shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95 ring-4 ring-white/40 backdrop-blur-sm"
        aria-label="Add new collection"
      >
        <PlusIcon className="h-7 w-7" />
      </button>
    </div>
  );
};

export default FloatingActionButton;