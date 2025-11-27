import React, { useMemo } from 'react';
import type { TreasurerProfile } from '../types';

interface OfflineCollectionEntry {
    tempId: string;
    collectionData: {
        name: string;
        amountPerUser: number;
        deadline?: string;
    };
    payments: { paidAmount: number }[];
}

interface OfflineProfilePageProps {
    profile: TreasurerProfile | null;
    offlineCollections: OfflineCollectionEntry[];
    onBack: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
};

const OfflineProfilePage: React.FC<OfflineProfilePageProps> = ({ profile, offlineCollections, onBack }) => {

    const stats = useMemo(() => {
        const totalOfflinePayments = offlineCollections.reduce((sum, coll) => sum + coll.payments.length, 0);
        const totalOfflineCollected = offlineCollections.flatMap(c => c.payments).reduce((sum, p) => sum + p.paidAmount, 0);
        
        return {
            totalOfflineCollections: offlineCollections.length,
            totalOfflineCollected,
            totalOfflinePayments,
        };
    }, [offlineCollections]);

    if (!profile) {
        return (
            <div className="bg-white/40 backdrop-blur-xl p-6 rounded-xl shadow-lg animate-fade-in border border-white/30 space-y-8">
                 <button onClick={onBack} className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors group mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Menu
                </button>
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-slate-900">No Profile Data</h3>
                    <p className="mt-1 text-sm text-slate-600">Your profile information hasn't been saved for offline use yet. Please go online to sync it.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white/40 backdrop-blur-xl p-6 rounded-xl shadow-lg animate-fade-in border border-white/30 space-y-8">
            <div>
                <button onClick={onBack} className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors group mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Menu
                </button>
            </div>
            
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center">
                <img src={profile.avatarUrl} alt={profile.name} className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-white shadow-lg"/>
                <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                    <h2 className="text-3xl font-bold text-gray-900">{profile.name}</h2>
                    <p className="text-md text-gray-600">{profile.studentId} • Class Treasurer (Offline)</p>
                </div>
            </div>

            {/* Offline Stats */}
            <div className="border-t border-white/50 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Offline Activity</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalOfflineCollections}</p>
                        <p className="text-sm text-gray-500">Collections</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalOfflineCollected)}</p>
                        <p className="text-sm text-gray-500">Collected</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalOfflinePayments}</p>
                        <p className="text-sm text-gray-500">Payments</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OfflineProfilePage;