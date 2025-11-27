import React, { useState, useMemo } from 'react';
import type { User } from '../types';
import { UsersIcon, SearchIcon, XCircleIcon } from './Icons';

interface StudentManagementProps {
    users: User[];
    onViewProfile: (user: User) => void;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ users, onViewProfile }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    return (
        <div className="bg-white/40 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl shadow-stone-200/20 animate-fade-in border border-white/50">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center pl-2">
                    <UsersIcon className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-stone-800 ml-3 tracking-tight">Manage Students</h2>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative w-full max-w-sm group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-stone-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-11 pr-10 py-2.5 border border-stone-200 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-all"
                    />
                    {searchQuery && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <button
                                onClick={() => setSearchQuery('')}
                                className="p-1 text-stone-400 hover:text-stone-600 focus:outline-none"
                                aria-label="Clear search"
                            >
                                <XCircleIcon className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <ul role="list" className="divide-y divide-stone-200/30">
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                    <li key={user.id}>
                        <button
                            onClick={() => onViewProfile(user)}
                            className="w-full flex items-center justify-between py-3 px-3 hover:bg-white/50 rounded-2xl transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 group"
                            aria-label={`View profile for ${user.name}`}
                        >
                            <div className="flex items-center min-w-0">
                                <img className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform" src={user.avatarUrl} alt={user.name} />
                                <div className="ml-4 min-w-0">
                                    <p className="text-sm font-bold text-stone-800 truncate group-hover:text-blue-700 transition-colors">{user.name}</p>
                                    <p className="text-xs text-stone-500 truncate">{user.role}</p>
                                </div>
                            </div>
                        </button>
                    </li>
                )) : (
                    <li className="text-center py-12 text-stone-500">
                        No students found matching your search.
                    </li>
                )}
            </ul>
        </div>
    );
};

export default StudentManagement;