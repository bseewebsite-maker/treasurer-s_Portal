import React, { useMemo } from 'react';
import type { User, Collection, PaymentStatuses } from '../types';
import { BanknotesIcon } from './Icons';

interface CashOnHandPageProps {
  users: User[];
  collections: Collection[];
  paymentStatuses: PaymentStatuses;
  onBack: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
};

const CashOnHandPage: React.FC<CashOnHandPageProps> = ({ users, collections, paymentStatuses, onBack }) => {
    const { totalCollected, collectedData } = useMemo(() => {
        const data = collections
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
            })
            .filter(c => c.collectionTotal > 0);
        
        const total = data.reduce((sum, d) => sum + d.collectionTotal, 0);

        return { totalCollected: total, collectedData: data };
    }, [users, collections, paymentStatuses]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in border border-slate-200">
            <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
                <div>
                    <button onClick={onBack} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Menu
                    </button>
                    <div className="flex items-center">
                        <BanknotesIcon className="h-8 w-8 text-green-600" />
                        <h2 className="text-2xl font-bold text-gray-800 ml-3">Cash on Hand</h2>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-600">Total Funds</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
                </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {collectedData.length > 0 ? collectedData.map(data => (
                    <div key={data.collectionName} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-gray-800">{data.collectionName}</h3>
                            <p className="text-sm font-bold text-green-700">{formatCurrency(data.collectionTotal)}</p>
                        </div>
                        <ul className="divide-y divide-slate-200">
                            {data.payments.map((p, index) => (
                                <li key={index} className="py-2 flex justify-between text-sm">
                                    <span className="text-gray-700">{p.userName}</span>
                                    <span className="text-gray-900 font-mono">{formatCurrency(p.amount)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 py-8">No payments have been collected yet for active collections.</p>
                )}
            </div>
        </div>
    );
};

export default CashOnHandPage;