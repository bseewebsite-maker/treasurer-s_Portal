import React from 'react';
import type { User, PaymentStatus } from '../types';
import { PencilIcon } from './Icons';

interface UserListItemProps {
  user: User;
  paymentStatus?: PaymentStatus;
  collectionAmount: number;
  onUpdateClick: () => void;
  onQuickSetPayment: (amount: number) => void;
  onViewProfile: () => void;
}

const UserListItem: React.FC<UserListItemProps> = ({
  user,
  paymentStatus,
  collectionAmount,
  onUpdateClick,
  onQuickSetPayment,
  onViewProfile,
}) => {
  const paidAmount = paymentStatus?.paidAmount ?? 0;
  const balance = collectionAmount - paidAmount;
  const isFullyPaid = balance <= 0;
  const isPartiallyPaid = paidAmount > 0 && !isFullyPaid;
  const isOverpaid = balance < 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const getStatusColor = () => {
    if (isFullyPaid) return 'text-green-600';
    if (isPartiallyPaid) return 'text-blue-600';
    return 'text-red-500';
  };

  return (
    <li className="py-4 flex items-center justify-between transition-all hover:bg-white/60 rounded-2xl px-4 -mx-4 border border-transparent hover:border-white/40 group mb-1">
      <div className="flex items-center min-w-0 flex-1 cursor-pointer" onClick={onViewProfile}>
        <img className="h-12 w-12 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm group-hover:scale-105 transition-transform" src={user.avatarUrl} alt={user.name} />
        <div className="ml-4 min-w-0 flex-1">
          {/* Line 1: Name */}
          <p className="text-sm font-bold text-stone-800 truncate group-hover:text-blue-700 transition-colors">{user.name}</p>

          {/* Line 2: Balance, Paid/Total, and Credit Info */}
          <div className="flex justify-between items-baseline mt-1 pr-4">
            <div className={`text-xs font-bold ${getStatusColor()}`}>
              {isFullyPaid ? (
                <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                    Paid in full
                </span>
              ) : (
                <span>Bal: {formatCurrency(balance)}</span>
              )}
            </div>

            <div className="text-xs text-stone-500 flex items-baseline font-medium">
              <span className="bg-white/50 px-2 py-0.5 rounded-md">
                {`${formatCurrency(paidAmount)} / ${formatCurrency(collectionAmount)}`}
              </span>
              {isOverpaid && (
                <span className="font-bold text-blue-600 ml-2">
                  +{formatCurrency(Math.abs(balance))}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="ml-2 flex-shrink-0 flex items-center space-x-2 opacity-80 group-hover:opacity-100 transition-opacity">
        {!isFullyPaid && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickSetPayment(collectionAmount); }}
            className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl shadow-sm transition-colors border border-blue-200"
            aria-label={`Mark ${user.name} as fully paid`}
          >
            Mark Paid
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onUpdateClick(); }}
          className="p-2 text-stone-400 rounded-xl hover:bg-stone-100 hover:text-stone-800 transition-colors"
          aria-label={`Update payment for ${user.name}`}
        >
          <PencilIcon className="h-5 w-5" />
        </button>
      </div>
    </li>
  );
};

export default UserListItem;