import React, { useState, useEffect } from 'react';
import type { Collection, User, TreasurerProfile } from '../types';
import CreateCollectionForm from './CreateCollectionForm';
import OfflineMenuPage from './OfflineMenuPage';
import OfflineDatabasePage from './OfflineDatabasePage';
import OfflineCollectionDetail from './OfflineCollectionDetail';
import OfflineCollectionListItem from './OfflineCollectionListItem';
import OfflineProfilePage from './OfflineProfilePage';
import { getUsersFromDB } from '../db/indexedDB';
import { CollectionIcon, PlusIcon, EllipsisHorizontalIcon, TrashIcon, CheckCircleIcon, ArrowPathIcon } from './Icons';

interface OfflineAppProps {
    onSwitchToOnline: () => void;
    isOnline: boolean;
    isManualMode: boolean;
}

type OfflineView = 'collections' | 'menu' | 'database' | 'detail' | 'profile';

// Types for offline data structure
interface OfflinePayment {
    userId: string;
    paidAmount: number;
    updatedAt: number; // Timestamp
}
interface OfflineCollectionEntry {
    tempId: string;
    collectionData: {
        name: string;
        amountPerUser: number;
        deadline?: string;
    };
    payments: OfflinePayment[];
    synced?: boolean; // Added for tracking
}

const OfflineApp: React.FC<OfflineAppProps> = ({ onSwitchToOnline, isOnline, isManualMode }) => {
    const [offlineCollections, setOfflineCollections] = useState<OfflineCollectionEntry[]>([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [view, setView] = useState<OfflineView>('collections');
    const [localUsers, setLocalUsers] = useState<User[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<OfflineCollectionEntry | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedForAction, setSelectedForAction] = useState<string[]>([]);
    const [treasurerProfile, setTreasurerProfile] = useState<TreasurerProfile | null>(null);
    const [showSyncPrompt, setShowSyncPrompt] = useState(false);


    useEffect(() => {
        const stored = localStorage.getItem('offlineCollections');
        if (stored) {
            setOfflineCollections(JSON.parse(stored));
        }

        const storedProfile = localStorage.getItem('treasurerProfile');
        if (storedProfile) {
            setTreasurerProfile(JSON.parse(storedProfile));
        }
        
        const fetchUsers = async () => {
            try {
                const users = await getUsersFromDB();
                setLocalUsers(users);
            } catch (e) {
                console.error("Failed to load local users for offline mode", e);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (isOnline && !isManualMode) {
            setShowSyncPrompt(true);
        } else {
            setShowSyncPrompt(false);
        }
    }, [isOnline, isManualMode]);

    useEffect(() => {
        localStorage.setItem('offlineCollections', JSON.stringify(offlineCollections));
    }, [offlineCollections]);
    
    useEffect(() => {
        if (selectedCollection) {
            const updatedCollection = offlineCollections.find(
                (c) => c.tempId === selectedCollection.tempId
            );
            if (updatedCollection) {
                setSelectedCollection(updatedCollection);
            } else {
                setSelectedCollection(null);
                setView('collections');
            }
        }
    }, [offlineCollections, selectedCollection?.tempId]);

    const handleSyncAndGoOnline = (idsToSync: 'all' | string[]) => {
        if (!isOnline) {
            alert("You must be online to perform a sync.");
            return;
        }
        setIsSyncing(true);
        setShowSyncPrompt(false);
        localStorage.setItem('syncInstructions', JSON.stringify(idsToSync));
        setTimeout(() => {
            onSwitchToOnline();
        }, 500);
    };
    
    const handleGoOnlineWithoutSync = () => {
        localStorage.removeItem('syncInstructions');
        onSwitchToOnline();
    };

    const handleSaveOfflineCollection = (collectionData: Omit<Collection, 'id'>) => {
        const newEntry: OfflineCollectionEntry = {
            tempId: `offline_${Date.now()}`,
            collectionData: {
                name: collectionData.name,
                amountPerUser: collectionData.amountPerUser,
                deadline: collectionData.deadline,
            },
            payments: [],
            synced: false,
        };
        setOfflineCollections(prev => [...prev, newEntry]);
        setIsFormVisible(false);
    };

    const handleUpdateOfflinePayment = (collectionTempId: string, userId: string, amount: number) => {
        setOfflineCollections(prev => {
            return prev.map(entry => {
                if (entry.tempId === collectionTempId) {
                    const existingPaymentIndex = entry.payments.findIndex(p => p.userId === userId);
                    const newPayments = [...entry.payments];
                    const paymentData = { userId, paidAmount: amount, updatedAt: Date.now() };
                    
                    if (existingPaymentIndex > -1) {
                        newPayments[existingPaymentIndex] = paymentData;
                    } else {
                        newPayments.push(paymentData);
                    }
                    
                    return { ...entry, payments: newPayments };
                }
                return entry;
            });
        });
    };
    
    const handleDeleteSelected = () => {
        setOfflineCollections(prev => prev.filter(c => !selectedForAction.includes(c.tempId)));
        setSelectedForAction([]);
    };
    
    const isSelectionModeActive = selectedForAction.length > 0;
    const handleStartSelectionMode = (tempId: string) => setSelectedForAction([tempId]);
    const handleToggleSelection = (tempId: string) => {
        setSelectedForAction(prev =>
            prev.includes(tempId) ? prev.filter(id => id !== tempId) : [...prev, tempId]
        );
    };
    const handleCancelSelection = () => setSelectedForAction([]);

    const handleNavigate = (targetView: OfflineView, collection?: OfflineCollectionEntry) => {
        if (collection) {
            setSelectedCollection(collection);
        }
        setView(targetView);
    };

    const pendingSyncCount = offlineCollections.filter(c => !c.synced).length;

    const renderContent = () => {
        if (view === 'detail' && selectedCollection) {
            return (
                <OfflineCollectionDetail
                    collectionEntry={selectedCollection}
                    users={localUsers}
                    onBack={() => setView('collections')}
                    onUpdatePayment={(userId, amount) => handleUpdateOfflinePayment(selectedCollection.tempId, userId, amount)}
                />
            );
        }
        if (view === 'database') {
            return <OfflineDatabasePage onBack={() => setView('menu')} />;
        }
        if (view === 'profile') {
            return <OfflineProfilePage 
                        profile={treasurerProfile}
                        offlineCollections={offlineCollections}
                        onBack={() => setView('menu')} 
                    />;
        }
        if (view === 'menu') {
            return (
                <OfflineMenuPage 
                    onNavigateToDatabase={() => setView('database')} 
                    onNavigateToProfile={() => setView('profile')}
                    onSyncAll={() => handleSyncAndGoOnline('all')}
                    pendingSyncCount={pendingSyncCount}
                    isSyncing={isSyncing}
                    isOnline={isOnline}
                    isManualMode={isManualMode}
                    onGoOnline={onSwitchToOnline}
                />
            );
        }
        
        // Default to 'collections' view
        return (
            <div className="space-y-6">
                <div className="flex items-center">
                    <CollectionIcon className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-800 ml-2">Offline Collections</h2>
                </div>
                {offlineCollections.length > 0 ? (
                    <div className="space-y-4">
                        {offlineCollections.map((entry) => (
                            <OfflineCollectionListItem
                                key={entry.tempId}
                                collectionEntry={entry}
                                onSelect={() => handleNavigate('detail', entry)}
                                isSelectionModeActive={isSelectionModeActive}
                                isSelected={selectedForAction.includes(entry.tempId)}
                                onStartSelectionMode={handleStartSelectionMode}
                                onToggleSelection={handleToggleSelection}
                                totalUsers={localUsers.length}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white/40 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg">
                        <CollectionIcon className="mx-auto h-12 w-12 text-slate-500" />
                        <h3 className="mt-2 text-lg font-medium text-slate-900">No offline collections</h3>
                        <p className="mt-1 text-sm text-slate-600">Get started by creating one.</p>
                    </div>
                )}
            </div>
        );
    };
    
    const navItems = [
        { view: 'collections' as const, label: 'Collections', icon: CollectionIcon },
        { view: 'menu' as const, label: 'Menu', icon: EllipsisHorizontalIcon },
    ];

    const getPageTitle = () => {
        switch(view) {
            case 'collections': return 'Offline Collections';
            case 'menu': return 'Offline Hub';
            case 'database': return 'Local Database';
            case 'detail': return 'Collection Details';
            case 'profile': return 'Offline Profile';
            default: return 'Offline Mode';
        }
    }

    return (
        <div className="min-h-screen text-gray-800">
            {showSyncPrompt && !isSyncing && (
                <div className="sticky top-0 z-50 p-3 bg-green-100 border-b-2 border-green-500 animate-fade-in shadow-lg">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="flex items-center">
                            <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3 flex-shrink-0"/>
                            <div>
                                <p className="font-bold text-green-800">You're back online!</p>
                                <p className="text-sm text-green-700">Ready to sync your offline work?</p>
                            </div>
                        </div>
                        <div className="flex space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                            <button 
                                onClick={() => handleSyncAndGoOnline('all')} 
                                className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow"
                            >
                                Sync & Refresh
                            </button>
                            <button 
                                onClick={handleGoOnlineWithoutSync} 
                                className="px-4 py-2 text-sm font-medium rounded-lg text-green-800 bg-green-200 hover:bg-green-300 transition-colors"
                            >
                                Go Online
                            </button>
                        </div>
                    </div>
                </div>
            )}
             <header className="bg-white/60 backdrop-blur-lg sticky top-0 z-30 border-b border-white/30 shadow-sm">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold leading-tight text-gray-900">
                        {getPageTitle()}
                    </h1>
                </div>
            </header>
            
            <main className="py-6 sm:px-6 lg:px-8 pb-24">
                <div className="max-w-4xl mx-auto">
                    {renderContent()}
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/60 backdrop-blur-xl border-t border-white/30 shadow-[0_-2px_15px_rgba(0,0,0,0.05)]">
                <nav className="flex justify-around items-center h-16 max-w-4xl mx-auto">
                    {navItems.map(item => {
                        const isActive = view === item.view;
                        const buttonClass = `flex flex-col items-center justify-center h-full w-full p-1 transition-colors duration-200 rounded-md ${
                            isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50/50'
                        }`;
                        const iconClass = 'h-6 w-6';

                        return (
                            <button 
                                key={item.view} 
                                onClick={() => setView(item.view)} 
                                className={buttonClass}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <item.icon className={iconClass} />
                                <span className="text-xs font-medium mt-1">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
            
            {isSelectionModeActive && (
                <div className="fixed bottom-16 left-0 right-0 bg-white/90 backdrop-blur-lg z-30 p-4 shadow-[0_-2px_15px_rgba(0,0,0,0.1)] animate-fade-in">
                    <div className="max-w-4xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
                        <span className="text-gray-800 font-semibold">
                            {selectedForAction.length} selected
                        </span>
                        <div className="flex space-x-3">
                            <button onClick={handleCancelSelection} className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-200/70 hover:bg-slate-300/80 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDeleteSelected} className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors">
                                <TrashIcon className="h-4 w-4 mr-2" /> Delete
                            </button>
                            <button onClick={() => handleSyncAndGoOnline(selectedForAction)} className="flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                                <ArrowPathIcon className="h-4 w-4 mr-2"/> Sync
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'collections' && !isSelectionModeActive && (
                <div className="fixed bottom-20 right-6 z-40">
                    <button
                        onClick={() => setIsFormVisible(true)}
                        className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform duration-200"
                        aria-label="Add Offline Collection"
                    >
                        <PlusIcon className="h-7 w-7" />
                    </button>
                </div>
            )}

            {isFormVisible && (
                <div 
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in"
                    onClick={() => setIsFormVisible(false)}
                >
                    <div onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto">
                        <CreateCollectionForm 
                            onSaveCollection={handleSaveOfflineCollection} 
                            onClose={() => setIsFormVisible(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfflineApp;