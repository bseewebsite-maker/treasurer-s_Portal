import React from 'react';
import { DatabaseIcon, UserCircleIcon, WifiSlashIcon, ArrowPathIcon } from './Icons';
import FancyToggleSwitch from './FancyToggleSwitch';

interface OfflineMenuPageProps {
    onNavigateToDatabase: () => void;
    onNavigateToProfile: () => void;
    onSyncAll: () => void;
    pendingSyncCount: number;
    isSyncing: boolean;
    isOnline: boolean;
    isManualMode: boolean;
    onGoOnline: () => void;
}


const OfflineMenuPage: React.FC<OfflineMenuPageProps> = ({ 
    onNavigateToDatabase, 
    onNavigateToProfile, 
    onSyncAll, 
    pendingSyncCount, 
    isSyncing,
    isOnline,
    isManualMode,
    onGoOnline
}) => {
    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/30 text-center">
                <WifiSlashIcon className="mx-auto h-12 w-12 text-blue-500" />
                <h2 className="mt-4 text-2xl font-bold text-gray-800">You're in Offline Mode</h2>
                <p className="mt-1 text-sm text-gray-600 max-w-md mx-auto">
                    Your work is being saved to this device. You can sync all your changes once you have a stable internet connection.
                </p>
                
                {isManualMode && (
                     <div className="mt-6 flex items-center justify-between space-x-3 p-3 bg-white/30 rounded-lg max-w-sm mx-auto">
                        <label htmlFor="offline-toggle-2" className="text-sm font-medium text-gray-800">Manual Offline</label>
                        <FancyToggleSwitch
                            id="offline-toggle-2"
                            checked={true} // Always on in this view
                            onChange={onGoOnline} // Toggling off goes online
                            disabled={!isOnline}
                        />
                    </div>
                )}
               
                <div className="mt-6">
                    <button
                        onClick={onSyncAll}
                        disabled={isSyncing || pendingSyncCount === 0 || !isOnline}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:bg-blue-400 disabled:cursor-wait"
                    >
                        {isSyncing ? (
                             <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                             <ArrowPathIcon className="h-5 w-5 mr-2" />
                        )}
                        Sync {pendingSyncCount > 0 ? `${pendingSyncCount} Item(s)` : 'All'} & Go Online
                    </button>
                    {!isOnline && (
                        <p className="mt-3 text-xs text-red-600">
                           You must be online to sync.
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                 <button
                    onClick={onNavigateToDatabase}
                    className="w-full text-left p-4 bg-white/40 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg flex items-center hover:bg-white/60 hover:border-blue-400/80 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                    <DatabaseIcon className="h-8 w-8 text-blue-500 mr-4"/>
                    <div>
                        <h3 className="font-semibold text-gray-800">Local Student Database</h3>
                        <p className="text-sm text-gray-600">View and manage the student data saved on this device.</p>
                    </div>
                </button>
                <button
                    onClick={onNavigateToProfile}
                    className="w-full text-left p-4 bg-white/40 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg flex items-center hover:bg-white/60 hover:border-blue-400/80 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                    <UserCircleIcon className="h-8 w-8 text-blue-500 mr-4"/>
                    <div>
                        <h3 className="font-semibold text-gray-800">Profile</h3>
                        <p className="text-sm text-gray-600">View your locally saved profile information.</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default OfflineMenuPage;