import React, { useMemo, useState } from 'react';
import type { User, Collection, PaymentStatuses, TreasurerProfile } from '../types';
import { PencilIcon } from './Icons';
import EditProfileModal from './EditProfileModal';

interface ProfilePageProps {
    collections: Collection[];
    paymentStatuses: PaymentStatuses;
    users: User[];
    treasurerProfile: TreasurerProfile;
    onSaveProfile: (profile: TreasurerProfile) => void;
    onBack: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
};

const ProfilePage: React.FC<ProfilePageProps> = ({ collections, paymentStatuses, users, treasurerProfile, onSaveProfile, onBack }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { lifetimeCollected, activeCollectionsCount } = useMemo(() => {
        const activeCollections = collections.filter(c => !c.remittanceDetails?.isRemitted);
        
        let collected = 0;
        activeCollections.forEach(collection => {
            users.forEach(user => {
                collected += paymentStatuses[user.id]?.[collection.id]?.paidAmount || 0;
            });
        });
    
        return { lifetimeCollected: collected, activeCollectionsCount: activeCollections.length };
    }, [users, collections, paymentStatuses]);
    
    const recentCollections = useMemo(() => {
        return collections
            .filter(c => !c.remittanceDetails?.isRemitted)
            .slice(0, 5); // App.tsx already sorts them by date
    }, [collections]);

    return (
        <>
            <div className="bg-white/40 backdrop-blur-xl p-6 rounded-xl shadow-lg animate-fade-in border border-white/30 space-y-8">
                <div>
                    <button onClick={onBack} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Menu
                    </button>
                </div>
                
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center">
                    <img src={treasurerProfile.avatarUrl} alt={treasurerProfile.name} className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-white shadow-lg"/>
                    <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                        <h2 className="text-3xl font-bold text-gray-900">{treasurerProfile.name}</h2>
                        <p className="text-md text-gray-600">{treasurerProfile.studentId} • Class Treasurer</p>
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="border-t border-white/50 pt-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{activeCollectionsCount}</p>
                            <p className="text-sm text-gray-500">Active Collections</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(lifetimeCollected)}</p>
                            <p className="text-sm text-gray-500">Funds on Hand</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                            <p className="text-sm text-gray-500">Members</p>
                        </div>
                    </div>
                </div>
                
                {/* Recent Collections */}
                <div className="border-t border-white/50 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Active Collections</h3>
                    {recentCollections.length > 0 ? (
                        <ul className="space-y-3">
                            {recentCollections.map(collection => {
                                const amountCollected = users.reduce((sum, user) => sum + (paymentStatuses[user.id]?.[collection.id]?.paidAmount ?? 0), 0);
                                const totalAmount = users.length * collection.amountPerUser;
                                const progress = totalAmount > 0 ? (amountCollected / totalAmount) * 100 : 0;
                                
                                return (
                                    <li key={collection.id} className="bg-white/30 p-4 rounded-lg border border-white/30">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-800">{collection.name}</p>
                                                <p className="text-xs text-gray-600 mt-1">Deadline: {formatDate(collection.deadline)}</p>
                                            </div>
                                            <p className="text-sm font-medium text-blue-700">{formatCurrency(amountCollected)}</p>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">No active collections have been created yet.</p>
                    )}
                </div>
            </div>

            {isEditModalOpen && (
                <EditProfileModal
                    profile={treasurerProfile}
                    onSave={(updatedProfile) => {
                        onSaveProfile(updatedProfile);
                        setIsEditModalOpen(false);
                    }}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </>
    );
};

export default ProfilePage;