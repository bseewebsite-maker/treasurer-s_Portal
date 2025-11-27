import React from 'react';
import type { User, Collection, PaymentStatuses } from '../types';

interface LifetimeCollectedModalProps {
  users: User[];
  collections: Collection[];
  paymentStatuses: PaymentStatuses;
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
};

const LifetimeCollectedModal: React.FC<LifetimeCollectedModalProps> = ({ users, collections, paymentStatuses, onClose }) => {
    const collectedData = collections
    .filter(c => !c.remittanceDetails?.isRemitted)
    .map(collection => {
        const payments = users
            .map(user => {
                const payment = paymentStatuses[user.id]?.[collection.id];
                const paidAmount = payment?.paidAmount ?? 0;
                return paidAmount > 0 ? { userName: user.name, amount: paidAmount } : null;
            })
            .filter((p): p is { userName: string; amount: number } => p !== null);
        
        const collectionTotal = payments.reduce((sum, p) => sum + (p?.amount || 0), 0);

        return {
            collectionName: collection.name,
            payments,
            collectionTotal
        };
    }).filter(c => c.payments.length > 0);

    return (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
            <div
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Funds on Hand Details</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="mt-4 flex-grow overflow-y-auto pr-2 space-y-4">
                    {collectedData.length > 0 ? collectedData.map(data => (
                        <div key={data.collectionName} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-gray-800 dark:text-white">{data.collectionName}</h3>
                                <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(data.collectionTotal)}</p>
                            </div>
                            <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                                {data.payments.map((p, index) => (
                                    <li key={index} className="py-2 flex justify-between text-sm">
                                        <span className="text-gray-700 dark:text-slate-300">{p.userName}</span>
                                        <span className="text-gray-900 dark:text-white font-mono">{formatCurrency(p.amount)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 dark:text-slate-400 py-8">No payments have been collected yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LifetimeCollectedModal;