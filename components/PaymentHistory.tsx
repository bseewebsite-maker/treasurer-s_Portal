import React, { useMemo, useState } from 'react';
import type { User, Collection, PaymentStatuses, RemittanceDetails } from '../types';
import { ClockIcon, SearchIcon, BanknotesIcon, XCircleIcon } from './Icons';

interface PaymentHistoryProps {
    users: User[];
    collections: Collection[];
    paymentStatuses: PaymentStatuses;
}

interface HistoryItem {
    id: string;
    type: 'payment' | 'remittance';
    timestamp: Date;
    // Payment-specific
    user?: User;
    collection?: Collection;
    payment?: { paidAmount: number; updatedAt: any };
    // Remittance-specific
    remittanceDetails?: RemittanceDetails;
    collectionName?: string;
    amount?: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
};

const formatTimestamp = (timestamp: { toDate: () => Date } | null): string => {
    if (!timestamp?.toDate) {
      return 'N/A';
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

const formatHistoryTimestamp = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
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

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ users, collections, paymentStatuses }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const paymentHistory = useMemo(() => {
        const history: HistoryItem[] = [];
        const userMap = new Map<string, User>(users.map(u => [u.id, u]));
        const collectionMap = new Map<string, Collection>(collections.map(c => [c.id, c]));

        // 1. Process payments
        for (const userId in paymentStatuses) {
            if (!Object.prototype.hasOwnProperty.call(paymentStatuses, userId)) continue;

            const userPayments = paymentStatuses[userId];
            const user = userMap.get(userId);

            if (!user) {
                continue;
            }

            if (userPayments) {
                for (const collectionId in userPayments) {
                    if (!Object.prototype.hasOwnProperty.call(userPayments, collectionId)) continue;
                    
                    const payment = userPayments[collectionId];
                    const collection = collectionMap.get(collectionId);

                    if (!collection || typeof collection.amountPerUser !== 'number') {
                        continue;
                    }
                    
                    if (payment && payment.paidAmount > 0 && payment.updatedAt && typeof payment.updatedAt.toDate === 'function') {
                        const timestamp = payment.updatedAt.toDate();
                        if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
                            history.push({
                                id: `${userId}-${collectionId}`,
                                type: 'payment',
                                timestamp,
                                user,
                                collection,
                                payment,
                            });
                        }
                    }
                }
            }
        }

        // 2. Process remittances
        const remittedCollections = collections.filter(c => c.remittanceDetails?.isRemitted && c.remittanceDetails.remittedAt && typeof (c.remittanceDetails.remittedAt as any).toDate === 'function');
        for (const collection of remittedCollections) {
            const amountCollected = users.reduce((sum, user) => {
                const payment = paymentStatuses[user.id]?.[collection.id];
                return sum + (payment?.paidAmount ?? 0);
            }, 0);

            if (amountCollected > 0 && collection.remittanceDetails) {
                const timestamp = (collection.remittanceDetails.remittedAt as any).toDate();
                 if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
                    history.push({
                        id: `remit-${collection.id}`,
                        type: 'remittance',
                        timestamp: timestamp,
                        collectionName: collection.name,
                        amount: amountCollected,
                        remittanceDetails: collection.remittanceDetails
                    });
                }
            }
        }

        // 3. Sort by timestamp descending
        history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        return history;
    }, [users, collections, paymentStatuses]);
    
    const filteredHistory = useMemo(() => {
        if (!searchQuery) return paymentHistory;
        return paymentHistory.filter(item => {
            const query = searchQuery.toLowerCase();
            if (item.type === 'payment' && item.user && item.collection) {
                return item.user.name.toLowerCase().includes(query) ||
                       item.collection.name.toLowerCase().includes(query);
            }
            if (item.type === 'remittance' && item.collectionName) {
                return item.collectionName.toLowerCase().includes(query) ||
                       item.remittanceDetails?.remittedBy?.toLowerCase().includes(query) ||
                       item.remittanceDetails?.receivedBy?.toLowerCase().includes(query);
            }
            return false;
        });
    }, [paymentHistory, searchQuery]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                    <ClockIcon className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-800 ml-2">Transaction History</h2>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative w-full max-w-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by student, collection..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-11 pr-10 py-2 border border-slate-300 bg-white rounded-full shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                    />
                    {searchQuery && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <button
                                onClick={() => setSearchQuery('')}
                                className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                                aria-label="Clear search"
                            >
                                <XCircleIcon className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <ul role="list" className="divide-y divide-slate-100">
                {filteredHistory.length > 0 ? filteredHistory.map(item => {
                    if (item.type === 'payment' && item.user && item.collection && item.payment) {
                        return (
                            <li key={item.id} className="flex items-center justify-between py-4 px-2 transition-colors hover:bg-slate-50 rounded-lg">
                                <div className="flex items-center min-w-0 flex-1">
                                    <img className="h-10 w-10 rounded-full object-cover flex-shrink-0" src={item.user.avatarUrl} alt={item.user.name} />
                                    <div className="ml-4 min-w-0">
                                        <p className="text-sm text-gray-900 break-words">
                                            <span className="font-semibold">{item.user.name}</span> paid for <span className="font-semibold">{item.collection.name}</span>
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {formatTimestamp(item.payment.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-4 text-right flex-shrink-0">
                                    <p className="text-sm font-semibold text-blue-700 font-mono">
                                        {formatCurrency(item.payment.paidAmount)}
                                    </p>
                                </div>
                            </li>
                        );
                    }
                    if (item.type === 'remittance' && item.collectionName && item.remittanceDetails) {
                        return (
                            <li key={item.id} className="flex items-center justify-between py-4 px-2 transition-colors hover:bg-slate-50 rounded-lg">
                                <div className="flex items-center min-w-0 flex-1">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <BanknotesIcon className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="ml-4 min-w-0">
                                        <p className="text-sm text-gray-900 break-words">
                                            <span className="font-semibold">Remitted '{item.collectionName}'</span>
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {formatHistoryTimestamp(item.timestamp)} by {item.remittanceDetails.remittedBy}
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-4 text-right flex-shrink-0">
                                    <p className="text-sm font-semibold text-red-700 font-mono">
                                        -{formatCurrency(item.amount || 0)}
                                    </p>
                                </div>
                            </li>
                        );
                    }
                    return null;
                }) : (
                    <li className="text-center py-8 text-gray-500">
                         {paymentHistory.length === 0 ? "No transaction history found." : "No history items match your search."}
                    </li>
                )}
            </ul>
        </div>
    );
};

export default PaymentHistory;