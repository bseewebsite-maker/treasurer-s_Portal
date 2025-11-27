import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { client as supabase } from '../supabase';
import { saveUsersToDB, getUsersFromDB } from '../db/indexedDB';
import { DatabaseIcon, ArrowPathIcon } from './Icons';

interface OfflineDatabasePageProps {
    onBack: () => void;
}

const OfflineDatabasePage: React.FC<OfflineDatabasePageProps> = ({ onBack }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    const [localUsers, setLocalUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastSync, setLastSync] = useState<string | null>(null);

    useEffect(() => {
        const fetchLocalData = async () => {
            setIsLoading(true);
            try {
                const users = await getUsersFromDB();
                setLocalUsers(users);
                const lastSyncTimestamp = localStorage.getItem('lastUserSyncTimestamp');
                setLastSync(lastSyncTimestamp);
            } catch (error) {
                console.error("Failed to load local users:", error);
                setSyncMessage('Could not load local student data.');
                setTimeout(() => setSyncMessage(''), 3000);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLocalData();
    }, []);

    const handleSyncClick = async () => {
        if (!navigator.onLine) {
            setSyncMessage('Error: You must be online to sync the student database.');
            setTimeout(() => setSyncMessage(''), 3000);
            return;
        }

        setIsSyncing(true);
        setSyncMessage('Syncing student data...');

        try {
            const defaultAvatarUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAgMCAyMS43NSAxMmMwLTUuMzg1LTQuMzY1LTkuNzUtOS43NS05Ljc1UzIuMjUgNi42MTUgMi4yNSAxMmE5LjcyMyA5LjcyMyAwIDAgMCAzLjA2NSA3LjA5N0E5LjcxNiA5LjcxNiAwIDAgMCAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAgMCA2LjY4NS0yLjY1M1ptLTEyLjU0LTEuMjg1QTcuNDg2IDcuNDg2IDAgMCAxIDEyIDE1YTcuNDg2IDcuNDg2IDAgMCAxIDUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMCAxIDEyIDIwLjI1YTguMjI0IDguMjI0IDAgMCAxLTUuODU1LTIuNDM4Wk0xNS43NSA5YTMuNzUgMy43NSAwIDEgMS03LjUgMCAzLjc1IDMuNzUgMCAwIDEgNy41IDBaIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+';

            const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('student_id, full_name, role, avatar_url');
            if (profilesError) {
                throw new Error(profilesError.message);
            }

            const usersToSave: User[] = profilesData.map((p: any) => ({
                id: p.student_id,
                name: p.full_name,
                role: p.role,
                avatarUrl: p.avatar_url || defaultAvatarUrl,
            }));

            await saveUsersToDB(usersToSave);
            setLocalUsers(usersToSave);
            setLastSync(localStorage.getItem('lastUserSyncTimestamp'));

            setSyncMessage(`Success! ${usersToSave.length} students saved for offline use.`);

        } catch (error: any) {
            console.error("Sync failed:", error);
            setSyncMessage(`Error: Failed to sync database. ${error.message || ''}`);
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncMessage(''), 5000);
        }
    };
    
    const formatSyncTime = (timestamp: string | null) => {
        if (!timestamp) return 'Never';
        return new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="bg-white/40 backdrop-blur-xl p-6 rounded-xl shadow-lg animate-fade-in border border-white/30 space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div>
                     <button onClick={onBack} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Menu
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">Local Student Database</h2>
                    <p className="text-xs text-gray-500 mt-1">Last synced: {formatSyncTime(lastSync)}</p>
                </div>
                <button
                    onClick={handleSyncClick}
                    disabled={isSyncing}
                    className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait"
                >
                    <ArrowPathIcon className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
            </div>
            {syncMessage && (
                <p className={`text-sm text-center p-2 rounded-md ${syncMessage.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {syncMessage}
                </p>
            )}

            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Locally Saved Students ({localUsers.length})
                </h3>
                {isLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading local data...</div>
                ) : localUsers.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto pr-2 rounded-lg border border-white/30 bg-white/20">
                        <ul className="divide-y divide-white/40">
                            {localUsers.map(user => (
                                <li key={user.id} className="flex items-center p-3">
                                <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover mr-3"/>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>No student data saved for offline use.</p>
                        <p className="text-sm mt-1">Go online and use the app or click 'Sync Now' to download.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OfflineDatabasePage;