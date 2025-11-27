import React from 'react';
import { CheckCircleIcon, XCircleIcon } from './Icons';

type ValidationStatus = 'pending' | 'success' | 'error';

interface ValidationChecklistItemProps {
  children: React.ReactNode;
  status: ValidationStatus;
}

const ValidationChecklistItem: React.FC<ValidationChecklistItemProps> = ({ children, status }) => {
  const getStatusClasses = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'pending':
      default:
        return 'text-slate-500 dark:text-slate-400';
    }
  };

  const renderIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5" />;
      case 'pending':
      default:
        return (
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
    }
  };

  return (
    <div className={`flex items-center p-3 rounded-lg transition-all duration-300 ${status === 'pending' ? 'bg-slate-100 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-700/50'}`}>
        <div className={`flex-shrink-0 mr-3 transition-colors duration-300 ${getStatusClasses()}`}>
            {renderIcon()}
        </div>
        <span className={`text-sm font-medium transition-colors duration-300 ${status === 'pending' ? 'text-slate-700 dark:text-slate-200' : getStatusClasses()}`}>
            {children}
        </span>
    </div>
  );
};

export default ValidationChecklistItem;