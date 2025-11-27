import React, { useState, useMemo } from 'react';
import type { User, Collection } from '../types';
import UpdatePaymentForm from './UpdatePaymentForm';
import { SearchIcon, DownloadIcon } from './Icons';

declare const XLSX: any;

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
}

interface OfflineCollectionDetailProps {
    collectionEntry: OfflineCollectionEntry;
    users: User[];
    onBack: () => void;
    onUpdatePayment: (userId: string, amount: number) => void;
}

const OfflineCollectionDetail: React.FC<OfflineCollectionDetailProps> = ({
  collectionEntry,
  users,
  onBack,
  onUpdatePayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const isFullyPaid = useMemo(() => {
    if (users.length === 0) return false;
    return users.every(user => 
      (collectionEntry.payments.find(p => p.userId === user.id)?.paidAmount ?? 0) >= collectionEntry.collectionData.amountPerUser
    );
  }, [users, collectionEntry]);

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const payment = collectionEntry.payments.find(p => p.userId === user.id);
        const paidAmount = payment?.paidAmount ?? 0;
        const isUserPaid = paidAmount >= collectionEntry.collectionData.amountPerUser;
        if (filterStatus === 'paid') return isUserPaid;
        if (filterStatus === 'unpaid') return !isUserPaid;
        return true;
      })
      .filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [users, collectionEntry, filterStatus, searchQuery]);

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

  const formatTimestamp = (timestamp: number | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

    const handleExport = () => {
    const formatPaymentTimestamp = (timestamp: number | undefined) => {
      if (!timestamp) {
        return { date: 'N/A', time: 'N/A' };
      }
      const jsDate = new Date(timestamp);
      return {
        date: jsDate.toLocaleDateString(),
        time: jsDate.toLocaleTimeString(),
      };
    };

    const header = [
      ['Collection name:', collectionEntry.collectionData.name],
      ['Amount:', collectionEntry.collectionData.amountPerUser],
      ['Deadline:', formatDate(collectionEntry.collectionData.deadline)],
    ];

    const bodyHeader = ['Name', 'Amount paid', 'Time', 'Date'];

    const body = users.map(user => {
      const payment = collectionEntry.payments.find(p => p.userId === user.id);
      const paidAmount = payment?.paidAmount ?? 0;
      const { date, time } = formatPaymentTimestamp(payment?.updatedAt);
      return [
        user.name,
        paidAmount,
        time,
        date,
      ];
    });

    const footer = [
      ['Treasurer Name:', 'Treasurer\'s Portal (Offline)']
    ];

    const dataForSheet = [
      ...header,
      [], // Spacer
      bodyHeader,
      ...body,
      [], // Spacer
      ...footer,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(dataForSheet);

    worksheet['!cols'] = [
      { wch: 30 }, // Name
      { wch: 15 }, // Amount Paid
      { wch: 15 }, // Time
      { wch: 15 }, // Date
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Collection Report');
    
    const safeFileName = `${collectionEntry.collectionData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_offline_export.xlsx`;
    XLSX.writeFile(workbook, safeFileName);
  };

  const getFilterButtonClass = (status: 'all' | 'paid' | 'unpaid') => {
    const base = 'relative px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-300 focus:outline-none';
    if (filterStatus === status) {
      return `${base} bg-white text-blue-700 font-bold shadow-md`;
    }
    return `${base} bg-transparent text-gray-600 hover:text-gray-800`;
  };

  const handleCloseUpdateModal = () => {
    setEditingUser(null);
  };

  const handleSavePayment = (amount: number) => {
    if (editingUser) {
      onUpdatePayment(editingUser.id, amount);
    }
    handleCloseUpdateModal();
  };

  const collectionForForm = {
      id: collectionEntry.tempId,
      name: collectionEntry.collectionData.name,
      amountPerUser: collectionEntry.collectionData.amountPerUser,
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl p-6 rounded-xl shadow-lg animate-fade-in border border-white/30">
        <div className="flex items-center justify-between mb-6 border-b border-white/50 pb-4">
            <div>
            <button onClick={onBack} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Offline Collections
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mt-2 flex items-center">
                {collectionEntry.collectionData.name}
                {isFullyPaid && (
                <span className="ml-3 px-2.5 py-1 text-sm font-semibold text-green-800 bg-green-100/80 rounded-full">
                    Fully Paid
                </span>
                )}
            </h2>
            <p className="text-sm text-gray-600">{`Dues: ${formatCurrency(collectionEntry.collectionData.amountPerUser)} per member`}</p>
            {collectionEntry.collectionData.deadline && (
                <p className="text-xs text-red-600 font-medium mt-1">
                    Deadline: {formatDate(collectionEntry.collectionData.deadline)}
                </p>
            )}
            </div>
        </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Student Payments</h3>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="relative flex-grow w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-500" />
                </div>
                <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-11 pr-4 py-2 border border-white/30 bg-white/50 rounded-full shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm ring-1 ring-white/50"
                />
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="flex items-center p-1 space-x-1 bg-white/30 backdrop-blur-sm rounded-full border border-white/30">
                    <button onClick={() => setFilterStatus('all')} className={getFilterButtonClass('all')}>All</button>
                    <button onClick={() => setFilterStatus('paid')} className={getFilterButtonClass('paid')}>Paid</button>
                    <button onClick={() => setFilterStatus('unpaid')} className={getFilterButtonClass('unpaid')}>Unpaid</button>
                </div>
                 <button
                    onClick={handleExport}
                    className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-800 bg-gray-500/20 backdrop-blur-sm border border-gray-500/20 hover:bg-gray-500/30 rounded-full shadow-sm transition-colors"
                >
                    <DownloadIcon className="h-4 w-4 mr-1.5"/>
                    Export
                </button>
            </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/30 shadow-md">
            <table className="min-w-full divide-y divide-white/30">
                <thead className="bg-white/30">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Student</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Amount Paid</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Balance</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Last Updated</th>
                </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-white/30">
                {filteredUsers.map((user) => {
                    const payment = collectionEntry.payments.find(p => p.userId === user.id);
                    const paidAmount = payment?.paidAmount ?? 0;
                    const balance = paidAmount - collectionEntry.collectionData.amountPerUser;

                    return (
                        <tr key={user.id} onClick={() => setEditingUser(user)} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl} alt={user.name} />
                            </div>
                            <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono text-right">
                            {formatCurrency(paidAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {balance === 0 && paidAmount > 0 ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span>
                            ) : balance > 0 ? (
                                <span className="font-semibold text-blue-600">
                                    {formatCurrency(balance)} credit
                                </span>
                            ) : balance < 0 ? (
                                <span className="font-semibold text-red-600">
                                    {formatCurrency(Math.abs(balance))} due
                                </span>
                            ) : (
                                <span className="text-gray-500">—</span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTimestamp(payment?.updatedAt)}
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
            </table>
             {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p>No students found.</p>
                    <p className="text-sm mt-1">Try adjusting your search or filter.</p>
                </div>
            )}
        </div>
      </div>

      {editingUser && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={handleCloseUpdateModal}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <UpdatePaymentForm
              user={editingUser}
              collection={collectionForForm as Collection}
              currentAmount={collectionEntry.payments.find(p => p.userId === editingUser.id)?.paidAmount || 0}
              onSave={handleSavePayment}
              onClose={handleCloseUpdateModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineCollectionDetail;