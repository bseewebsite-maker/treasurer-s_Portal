import React, { useState, useEffect } from 'react';
import type { User, Collection, PaymentStatuses } from '../types';
import { BellIcon } from './Icons';

declare const XLSX: any;

interface SettingsPageProps {
    users: User[];
    collections: Collection[];
    paymentStatuses: PaymentStatuses;
    onBack: () => void;
}

type DeadlineTiming = 'none' | '10-min-before' | '1-hour-before' | '1-day-before' | '2-days-before';

// A simple, self-contained toggle switch component
const ToggleSwitch = ({ id, checked, onChange, disabled }: { id: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean }) => (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id={id} checked={checked} onChange={onChange} disabled={disabled} className="sr-only peer" />
        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'peer-checked:bg-blue-600'}`}></div>
    </label>
);


const SettingsPage: React.FC<SettingsPageProps> = ({ users, collections, paymentStatuses, onBack }) => {
    // Notification states
    const [areNotificationsGloballyEnabled, setAreNotificationsGloballyEnabled] = useState(() => localStorage.getItem('areNotificationsGloballyEnabled') !== 'false');
    const [newCollectionNotifications, setNewCollectionNotifications] = useState(() => localStorage.getItem('newCollectionNotifications') !== 'false');
    const [paymentNotifications, setPaymentNotifications] = useState(() => localStorage.getItem('paymentNotifications') !== 'false');
    const [deadlineReminderTiming, setDeadlineReminderTiming] = useState<DeadlineTiming>(() => (localStorage.getItem('deadlineReminderTiming') as DeadlineTiming) || '1-day-before');
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

    // Save notification settings to localStorage whenever they change
    useEffect(() => { localStorage.setItem('areNotificationsGloballyEnabled', String(areNotificationsGloballyEnabled)); }, [areNotificationsGloballyEnabled]);
    useEffect(() => { localStorage.setItem('newCollectionNotifications', String(newCollectionNotifications)); }, [newCollectionNotifications]);
    useEffect(() => { localStorage.setItem('paymentNotifications', String(paymentNotifications)); }, [paymentNotifications]);
    useEffect(() => { localStorage.setItem('deadlineReminderTiming', deadlineReminderTiming); }, [deadlineReminderTiming]);

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        }
    };

    const handleExportAllData = () => {
        const workbook = XLSX.utils.book_new();

        // Summary Sheet
        let lifetimeCollected = 0;
        collections.forEach(collection => {
            users.forEach(user => {
                lifetimeCollected += paymentStatuses[user.id]?.[collection.id]?.paidAmount || 0;
            });
        });
        const summaryData = [
            ["Metric", "Value"],
            ["Total Students", users.length],
            ["Total Collections", collections.length],
            ["Lifetime Amount Collected", lifetimeCollected],
        ];
        const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
        summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");

        // Members Sheet
        const membersData = [
            ["Full Name", "Role"],
            ...users.map(u => [u.name, u.role])
        ];
        const membersWorksheet = XLSX.utils.aoa_to_sheet(membersData);
        membersWorksheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, membersWorksheet, "All Students");

        // Individual Collection Sheets
        collections.forEach(collection => {
            const collectionData = [
                ["Name", "Amount Paid", "Status"],
                ...users.map(user => {
                    const paidAmount = paymentStatuses[user.id]?.[collection.id]?.paidAmount ?? 0;
                    const status = paidAmount >= collection.amountPerUser ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Unpaid');
                    return [user.name, paidAmount, status];
                })
            ];
            const collectionWorksheet = XLSX.utils.aoa_to_sheet(collectionData);
            collectionWorksheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
            const safeSheetName = collection.name.replace(/[^a-zA-Z0-9]/g, ' ').substring(0, 31);
            XLSX.utils.book_append_sheet(workbook, collectionWorksheet, safeSheetName);
        });

        XLSX.writeFile(workbook, "treasurers_portal_full_export.xlsx");
    };

    const renderNotificationPermissionStatus = () => {
        switch (notificationPermission) {
            case 'granted':
                return <p className="text-xs text-green-700">Browser notifications are enabled.</p>;
            case 'denied':
                return <p className="text-xs text-red-700">Browser notifications are blocked. You must enable them in your browser settings.</p>;
            default:
                return (
                    <button onClick={requestNotificationPermission} className="text-xs text-blue-600 font-semibold hover:underline">
                        Enable browser notifications for reminders.
                    </button>
                );
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in border border-slate-200 space-y-8">
            <div>
                <button onClick={onBack} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Menu
                </button>
                <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            </div>
            
            {/* Notifications Section */}
            <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center mb-4">
                    <BellIcon className="w-6 h-6 mr-2 text-blue-600"/>
                    <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                </div>
                <div className="space-y-4 p-4 bg-white/50 rounded-xl border border-slate-200">
                    <div className="mb-4">{renderNotificationPermissionStatus()}</div>
                    
                    {/* Master Switch */}
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <div>
                            <label htmlFor="master-notifications" className="font-medium text-gray-900">Enable Notifications</label>
                            <p className="text-xs text-gray-600">Master switch for all alerts.</p>
                        </div>
                        <ToggleSwitch id="master-notifications" checked={areNotificationsGloballyEnabled} onChange={(e) => setAreNotificationsGloballyEnabled(e.target.checked)} />
                    </div>

                    {/* Individual Settings */}
                    <div className={`space-y-3 transition-opacity duration-300 ${areNotificationsGloballyEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div className="flex justify-between items-center pl-3">
                            <label htmlFor="new-collection-notifications" className="text-sm text-gray-800">Notify for new collections</label>
                            <ToggleSwitch id="new-collection-notifications" checked={newCollectionNotifications} onChange={(e) => setNewCollectionNotifications(e.target.checked)} disabled={!areNotificationsGloballyEnabled} />
                        </div>
                        <div className="flex justify-between items-center pl-3">
                             <label htmlFor="payment-notifications" className="text-sm text-gray-800">Notify for new payments</label>
                            <ToggleSwitch id="payment-notifications" checked={paymentNotifications} onChange={(e) => setPaymentNotifications(e.target.checked)} disabled={!areNotificationsGloballyEnabled} />
                        </div>
                        <div className="flex justify-between items-center pl-3">
                             <label htmlFor="deadline-reminders" className="text-sm text-gray-800">Deadline Reminders</label>
                            <select
                                id="deadline-reminders"
                                value={deadlineReminderTiming}
                                onChange={(e) => setDeadlineReminderTiming(e.target.value as DeadlineTiming)}
                                disabled={!areNotificationsGloballyEnabled}
                                className="text-xs bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5 disabled:opacity-70"
                            >
                                <option value="none">None</option>
                                <option value="10-min-before">10 mins before</option>
                                <option value="1-hour-before">1 hour before</option>
                                <option value="1-day-before">1 day before</option>
                                <option value="2-days-before">2 days before</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Management Section */}
            <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
                <div>
                    <button
                        onClick={handleExportAllData}
                        className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                    >
                        Export All Data as XLSX
                    </button>
                    <p className="text-xs text-gray-600 mt-2">This will download a single .xlsx file containing a summary, student list, and a detailed sheet for each collection.</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;