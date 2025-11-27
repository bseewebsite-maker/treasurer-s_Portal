import React from 'react';
import { CollectionIcon, AiIcon } from './Icons';

interface AddCollectionChoiceModalProps {
  onClose: () => void;
  onManualCreate: () => void;
  onAiCreate: () => void;
}

const AddCollectionChoiceModal: React.FC<AddCollectionChoiceModalProps> = ({ onClose, onManualCreate, onAiCreate }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white p-6 shadow-2xl w-full max-w-lg border sm:border-slate-200 sm:rounded-2xl rounded-t-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add a New Collection</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-center text-sm text-gray-600 mb-6">How would you like to get started?</p>
        
        <div className="space-y-4">
          <button
            onClick={onManualCreate}
            className="w-full text-left p-4 border border-slate-300 rounded-xl flex items-center hover:bg-teal-50 hover:border-teal-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-300"
          >
            <CollectionIcon className="h-10 w-10 text-teal-500 mr-4 flex-shrink-0"/>
            <div>
              <h3 className="font-semibold text-gray-800">Create Manually</h3>
              <p className="text-sm text-gray-600">Fill out a form to create a standard or recurring collection.</p>
            </div>
          </button>
          
          <button
            onClick={onAiCreate}
            className="w-full text-left p-4 border border-slate-300 rounded-xl flex items-center hover:bg-cyan-50 hover:border-cyan-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
          >
            <AiIcon className="h-10 w-10 mr-4 flex-shrink-0"/>
            <div>
              <h3 className="font-semibold text-gray-800">Create from File with AI</h3>
              <p className="text-sm text-gray-600">Upload an XLSX file and let AI automatically set up your collection.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCollectionChoiceModal;