import React, { useState, useEffect } from 'react';
import { BanknotesIcon } from './Icons';

interface RemittanceFormProps {
  onSave: (remittedBy: string, receivedBy: string) => void;
  onClose: () => void;
  defaultRemittedBy?: string;
}

const RemittanceForm: React.FC<RemittanceFormProps> = ({ onSave, onClose, defaultRemittedBy }) => {
  const [remittedBy, setRemittedBy] = useState('');
  const [receivedBy, setReceivedBy] = useState('');

  useEffect(() => {
    if (defaultRemittedBy) {
      setRemittedBy(defaultRemittedBy);
    }
  }, [defaultRemittedBy]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remittedBy.trim() || !receivedBy.trim()) {
        alert("Both names are required.");
        return;
    }
    onSave(remittedBy, receivedBy);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200">
      <div className="flex items-center mb-4">
        <BanknotesIcon className="w-6 h-6 text-green-600 mr-2" />
        <h2 className="text-xl font-bold text-gray-800">Confirm Remittance</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">Enter the details below. The current date and time will be recorded automatically.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="remitted-by" className="block text-sm font-medium text-gray-700">
            Remitted By (Payer)
          </label>
          <input
            type="text"
            id="remitted-by"
            value={remittedBy}
            onChange={(e) => setRemittedBy(e.target.value)}
            placeholder="e.g., Your Name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="received-by" className="block text-sm font-medium text-gray-700">
            Received By
          </label>
          <input
            type="text"
            id="received-by"
            value={receivedBy}
            onChange={(e) => setReceivedBy(e.target.value)}
            placeholder="e.g., Officer's Name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        
        <div className="flex space-x-2 pt-2">
            <button
                type="button"
                onClick={onClose}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
            >
                Cancel
            </button>
            <button
            type="submit"
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
            >
            <BanknotesIcon className="w-5 h-5 mr-2 -ml-1" />
            Confirm & Save
            </button>
        </div>
      </form>
    </div>
  );
};

export default RemittanceForm;