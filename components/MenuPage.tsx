import React from 'react';
import { Cog6ToothIcon, UserCircleIcon, UsersIcon, BanknotesIcon } from './Icons';

interface MenuPageProps {
    setActiveView: (view: 'settings' | 'profile' | 'members' | 'cashOnHand') => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ setActiveView }) => {
    const handleSettingsClick = () => {
        setActiveView('settings');
    };

    const handleProfileClick = () => {
        setActiveView('profile');
    };

    return (
        <div className="bg-white/40 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl shadow-stone-200/20 border border-white/50 space-y-8 animate-fade-in">
             <div className="pl-2">
                <h2 className="text-2xl font-bold text-stone-800">Menu</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                 <button
                    onClick={handleProfileClick}
                    className="w-full text-left p-5 bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm flex items-center hover:bg-blue-50 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 group"
                >
                    <div className="bg-blue-100 p-3 rounded-full mr-4 group-hover:bg-blue-200 transition-colors">
                         <UserCircleIcon className="h-7 w-7 text-blue-600"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-stone-800 group-hover:text-blue-800 transition-colors">Profile</h3>
                        <p className="text-xs text-stone-500 mt-0.5">View and manage your profile.</p>
                    </div>
                </button>
                 <button
                    onClick={() => setActiveView('members')}
                    className="w-full text-left p-5 bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm flex items-center hover:bg-indigo-50 hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 group"
                >
                    <div className="bg-indigo-100 p-3 rounded-full mr-4 group-hover:bg-indigo-200 transition-colors">
                        <UsersIcon className="h-7 w-7 text-indigo-600"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-stone-800 group-hover:text-indigo-800 transition-colors">Manage Students</h3>
                        <p className="text-xs text-stone-500 mt-0.5">View the class roster.</p>
                    </div>
                </button>
                <button
                    onClick={() => setActiveView('cashOnHand')}
                    className="w-full text-left p-5 bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm flex items-center hover:bg-emerald-50 hover:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 group"
                >
                    <div className="bg-emerald-100 p-3 rounded-full mr-4 group-hover:bg-emerald-200 transition-colors">
                        <BanknotesIcon className="h-7 w-7 text-emerald-600"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-stone-800 group-hover:text-emerald-800 transition-colors">Cash on Hand</h3>
                        <p className="text-xs text-stone-500 mt-0.5">View a summary of collected funds.</p>
                    </div>
                </button>
                <button
                    onClick={handleSettingsClick}
                    className="w-full text-left p-5 bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm flex items-center hover:bg-stone-100 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-all duration-300 group"
                >
                    <div className="bg-stone-200 p-3 rounded-full mr-4 group-hover:bg-stone-300 transition-colors">
                         <Cog6ToothIcon className="h-7 w-7 text-stone-600"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-stone-800 group-hover:text-stone-900 transition-colors">Settings</h3>
                        <p className="text-xs text-stone-500 mt-0.5">Manage application settings.</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default MenuPage;