import React, { useState } from 'react';
import type { User, Collection } from '../types';
import { BanknotesIcon } from './Icons';

interface UpdatePaymentFormProps {
  user: User;
  collection: Collection;
  currentAmount: number;
  onSave: (amount: number) => void;
  onClose: () => void;
}

const UpdatePaymentForm: React.FC<UpdatePaymentFormProps> = ({ user, collection, currentAmount, onSave, onClose }) => {
  const [amount, setAmount] = useState(currentAmount.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(parseFloat(amount) || 0);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-sm border border-stone-200">
      <h2 className="text-xl font-bold text-stone-800 mb-2">Update Payment</h2>
      <div className="mb-4 text-sm text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
        <p><span className="font-semibold text-stone-800">Student:</span> {user.name}</p>
        <p><span className="font-semibold text-stone-800">Collection:</span> {collection.name}</p>
        <p><span className="font-semibold text-stone-800">Required Amount:</span> {formatCurrency(collection.amountPerUser)}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="amount-paid" className="block text-sm font-bold text-stone-700 mb-1">
            Amount Paid (₱)
          </label>
          <input
            type="number"
            id="amount-paid"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full px-4 py-3 border border-stone-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold text-stone-800"
            step="0.01"
            min="0"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
            <button
                type="button"
                onClick={() => setAmount('0')}
                className="px-2 py-2 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 transition-colors"
            >
                Unpaid (0)
            </button>
            <button
                type="button"
                onClick={() => setAmount(collection.amountPerUser.toString())}
                className="px-2 py-2 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl border border-blue-200 transition-colors"
            >
                Full ({collection.amountPerUser})
            </button>
            <button
                type="button"
                onClick={() => setAmount((collection.amountPerUser / 2).toString())}
                className="px-2 py-2 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl border border-blue-200 transition-colors"
            >
                Half ({collection.amountPerUser / 2})
            </button>
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex justify-center items-center px-4 py-2.5 border border-stone-300 text-sm font-medium rounded-xl shadow-sm text-stone-700 bg-white hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <BanknotesIcon className="w-5 h-5 mr-2 -ml-1" />
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdatePaymentForm;