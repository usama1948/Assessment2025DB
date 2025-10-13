import React, { useState } from 'react';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md transition-all duration-300">
      <div 
        className="flex justify-between items-center p-4 sm:p-6 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${title.replace(/\s+/g, '-')}`}
      >
        <h3 className="text-xl font-bold text-sky-700">{title}</h3>
        <button 
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded-md p-1"
          aria-label={isOpen ? `إخفاء سجلات ${title}` : `إظهار سجلات ${title}`}
        >
          <span>{isOpen ? 'إخفاء السجلات' : 'إظهار السجلات'}</span>
          {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </button>
      </div>
      {isOpen && (
        <div 
          id={`collapsible-content-${title.replace(/\s+/g, '-')}`}
          className="p-4 sm:p-6 border-t border-slate-200"
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
