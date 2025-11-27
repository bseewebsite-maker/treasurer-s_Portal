import React from 'react';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-200">
      <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
      <div className="mt-2">
        <p className="text-sm text-gray-700">{message}</p>
      </div>
      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ConfirmationModal;