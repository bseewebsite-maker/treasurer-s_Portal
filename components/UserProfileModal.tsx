import React from 'react';
import type { User, Collection, PaymentStatuses } from '../types';

interface UserProfileModalProps {
  user: User;
  collections: Collection[];
  paymentStatuses: PaymentStatuses;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, collections, paymentStatuses, onClose }) => {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const formatTimestamp = (timestamp: { toDate: () => Date } | null): string => {
    if (!timestamp?.toDate) {
      return 'Not yet paid';
    }
    const date = timestamp.toDate();
    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (paidAmount: number, collectionAmount: number) => {
    if (paidAmount >= collectionAmount) {
      return { text: 'Paid', classes: 'bg-green-100 text-green-800' };
    }
    if (paidAmount > 0) {
      return { text: 'Partial', classes: 'bg-yellow-100 text-yellow-800' };
    }
    return { text: 'Unpaid', classes: 'bg-red-100 text-red-800' };
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center pb-4 border-b border-slate-200">
          <img className="h-16 w-16 rounded-full object-cover shadow-lg" src={user.avatarUrl} alt={user.name} />
          <div className="ml-4">
            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-sm text-gray-600">{user.role}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Payment History */}
        <div className="mt-4 flex-grow overflow-y-auto pr-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Payment History</h3>
          <ul className="space-y-3">
            {collections.map(collection => {
              const payment = paymentStatuses[user.id]?.[collection.id];
              const paidAmount = payment?.paidAmount ?? 0;
              const status = getStatusInfo(paidAmount, collection.amountPerUser);
              
              return (
                <li key={collection.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-gray-800">{collection.name}</p>
                        <p className="text-xs text-gray-600 mt-1">
                            Last Updated: {formatTimestamp(payment?.updatedAt)}
                        </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                        <p className={`px-2.5 py-0.5 text-xs font-medium rounded-full inline-block ${status.classes}`}>
                            {status.text}
                        </p>
                        <p className="text-sm text-gray-700 font-medium mt-1">
                            {`${formatCurrency(paidAmount)} / ${formatCurrency(collection.amountPerUser)}`}
                        </p>
                    </div>
                  </div>
                </li>
              );
            })}
            {collections.length === 0 && (
                <p className="text-center text-gray-500 py-4">No collections available to show history.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;