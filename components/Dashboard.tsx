import React, { useMemo, useState } from 'react';
import type { User, Collection, PaymentStatuses } from '../types';
import StatCard from './StatCard';
import { UsersIcon, CollectionIcon } from './Icons';
import LifetimeCollectedModal from './LifetimeCollectedModal';
import TotalOutstandingModal from './TotalOutstandingModal';

interface DashboardProps {
    users: User[];
    collections: Collection[];
    paymentStatuses: PaymentStatuses;
    onNavigate: (view: 'dashboard' | 'collections' | 'members') => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const Dashboard: React.FC<DashboardProps> = ({ users, collections, paymentStatuses, onNavigate }) => {
    const [isLifetimeModalOpen, setIsLifetimeModalOpen] = useState(false);
    const [isOutstandingModalOpen, setIsOutstandingModalOpen] = useState(false);

    const stats = useMemo(() => {
        const activeCollections = collections.filter(c => !c.remittanceDetails?.isRemitted);

        let lifetimeCollected = 0;
        let totalOutstanding = 0;

        activeCollections.forEach(collection => {
            users.forEach(user => {
                const paidAmount = paymentStatuses[user.id]?.[collection.id]?.paidAmount || 0;
                lifetimeCollected += paidAmount;
                
                if (paidAmount < collection.amountPerUser) {
                    totalOutstanding += (collection.amountPerUser - paidAmount);
                }
            });
        });

        return {
            totalMembers: users.length,
            activeCollections: activeCollections.length,
            lifetimeCollected,
            totalOutstanding
        };
    }, [users, collections, paymentStatuses]);
    
    const upcomingDeadlines = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
    
        return collections
            .filter(c => c.deadline && new Date(c.deadline) >= today && !c.remittanceDetails?.isRemitted)
            .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
            .slice(0, 5);
    }, [collections]);

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <button onClick={() => onNavigate('members')} className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 rounded-[2rem] transition-transform hover:scale-[1.02]">
                    <StatCard 
                        title="Total Students" 
                        value={stats.totalMembers.toString()}
                        icon={<UsersIcon className="h-7 w-7 text-indigo-600" />}
                        color="bg-indigo-100/50"
                    />
                </button>
                <button onClick={() => setIsLifetimeModalOpen(true)} className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 rounded-[2rem] transition-transform hover:scale-[1.02]">
                    <StatCard 
                        title="Funds on Hand" 
                        value={formatCurrency(stats.lifetimeCollected)}
                        icon={<div className="text-2xl font-bold text-green-600">₱</div>}
                        color="bg-green-100/50"
                    />
                </button>
                <button onClick={() => setIsOutstandingModalOpen(true)} className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 rounded-[2rem] transition-transform hover:scale-[1.02]">
                    <StatCard 
                        title="Outstanding" 
                        value={formatCurrency(stats.totalOutstanding)}
                        icon={<div className="text-2xl font-bold text-red-600">!</div>}
                        color="bg-red-100/50"
                    />
                </button>
                 <StatCard 
                    title="Active Pools" 
                    value={stats.activeCollections.toString()}
                    icon={<CollectionIcon className="h-7 w-7 text-blue-600" />}
                    color="bg-blue-100/50"
                />
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white/40 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl shadow-stone-200/20 border border-white/50">
                <h2 className="text-xl font-bold text-stone-800 mb-4 tracking-tight pl-2">Upcoming Deadlines</h2>
                {upcomingDeadlines.length > 0 ? (
                    <ul className="divide-y divide-stone-200/30">
                        {upcomingDeadlines.map(collection => (
                             <li key={collection.id} className="py-4 flex items-center justify-between group hover:bg-white/40 rounded-2xl px-3 transition-colors -mx-2">
                                <div>
                                    <p className="text-sm font-bold text-stone-800 group-hover:text-blue-700 transition-colors">{collection.name}</p>
                                    <p className="text-xs text-stone-500">{formatCurrency(collection.amountPerUser)} per student</p>
                                </div>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50/80 px-3 py-1.5 rounded-full shadow-sm">
                                    {formatDate(collection.deadline)}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-stone-500 py-8 text-sm font-medium">No upcoming deadlines.</p>
                )}
            </div>

            {/* Modals */}
            {isLifetimeModalOpen && (
                <LifetimeCollectedModal
                    users={users}
                    collections={collections}
                    paymentStatuses={paymentStatuses}
                    onClose={() => setIsLifetimeModalOpen(false)}
                />
            )}
            {isOutstandingModalOpen && (
                <TotalOutstandingModal
                    users={users}
                    collections={collections}
                    paymentStatuses={paymentStatuses}
                    onClose={() => setIsOutstandingModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Dashboard;