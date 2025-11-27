import React, { useState, useMemo } from 'react';
import type { Collection, User, PaymentStatuses } from '../types';
import UserList from './UserList';
import ConfirmationModal from './ConfirmationModal';
import UpdatePaymentForm from './UpdatePaymentForm';
import { SearchIcon, DownloadIcon, BanknotesIcon, XCircleIcon } from './Icons';

declare const XLSX: any;

interface CollectionDetailProps {
  collection: Collection;
  users: User[];
  paymentStatuses: PaymentStatuses;
  onUpdatePayment: (userId: string, collectionId: string, amount: number) => void;
  onMarkAll: (isPaid: boolean) => void;
  onBack: () => void;
  onViewProfile: (user: User) => void;
}

type FilterStatus = 'all' | 'paid' | 'unpaid' | 'balance' | 'credits';

const CollectionDetail: React.FC<CollectionDetailProps> = ({
  collection,
  users,
  paymentStatuses,
  onUpdatePayment,
  onMarkAll,
  onBack,
  onViewProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [confirmAction, setConfirmAction] = useState<'paid' | 'unpaid' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const isFullyPaid = useMemo(() => {
    if (users.length === 0) return false;
    return users.every(user => 
      (paymentStatuses[user.id]?.[collection.id]?.paidAmount ?? 0) >= collection.amountPerUser
    );
  }, [users, paymentStatuses, collection.id, collection.amountPerUser]);


  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const paidAmount = paymentStatuses[user.id]?.[collection.id]?.paidAmount ?? 0;
        
        switch (filterStatus) {
            case 'paid':
                return paidAmount === collection.amountPerUser;
            case 'credits':
                return paidAmount > collection.amountPerUser;
            case 'balance':
                return paidAmount > 0 && paidAmount < collection.amountPerUser;
            case 'unpaid':
                return paidAmount === 0;
            case 'all':
            default:
                return true;
        }
      })
      .filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [users, paymentStatuses, collection.id, filterStatus, searchQuery, collection.amountPerUser]);

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

  const formatTimestamp = (timestamp: { toDate: () => Date } | null): string => {
    if (!timestamp?.toDate) {
      return 'N/A';
    }
    const date = timestamp.toDate();
    if (isNaN(date.getTime())) {
        return 'Invalid date';
    }
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = () => {
    const formatPaymentTimestamp = (timestamp: any) => {
      if (!timestamp || typeof timestamp.toDate !== 'function') {
        return { date: 'N/A', time: 'N/A' };
      }
      const jsDate = timestamp.toDate();
      return {
        date: jsDate.toLocaleDateString(),
        time: jsDate.toLocaleTimeString(),
      };
    };

    const header = [
      ['Collection name:', collection.name],
      ['Amount:', collection.amountPerUser],
      ['Deadline:', formatDate(collection.deadline)],
    ];

    const bodyHeader = ['Name', 'Amount paid', 'Time', 'Date'];

    const body = users.map(user => {
      const payment = paymentStatuses[user.id]?.[collection.id];
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
      ['Treasurer Name:', 'Treasurer\'s Portal User']
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
    
    const safeFileName = `${collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.xlsx`;
    XLSX.writeFile(workbook, safeFileName);
  };

  const getFilterButtonClass = (status: FilterStatus) => {
    const base = 'relative px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 focus:outline-none whitespace-nowrap border border-transparent';
    if (filterStatus === status) {
      return `${base} bg-white text-blue-700 shadow-md ring-1 ring-blue-100`;
    }
    return `${base} bg-transparent text-stone-500 hover:text-stone-800 hover:bg-white/40`;
  };

  const handleOpenUpdateModal = (user: User) => {
    setEditingUser(user);
  };

  const handleCloseUpdateModal = () => {
    setEditingUser(null);
  };

  const handleSavePayment = (amount: number) => {
    if (editingUser) {
      onUpdatePayment(editingUser.id, collection.id, amount);
    }
    handleCloseUpdateModal();
  };


  return (
    <div className="bg-white/40 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-stone-200/20 border border-white/50 animate-fade-in">
      <div className="flex items-center justify-between mb-8 border-b border-stone-200/30 pb-6">
        <div>
          <button onClick={onBack} className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors group mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Collections
          </button>
          <h2 className="text-3xl font-bold text-stone-800 mt-2 flex items-center tracking-tight">
            {collection.name}
            {isFullyPaid && (
              <span className="ml-4 px-3 py-1 text-xs font-bold text-green-800 bg-green-100/80 border border-green-200 rounded-full shadow-sm">
                Paid in Full
              </span>
            )}
          </h2>
          <div className="mt-2 flex items-center space-x-4 text-sm text-stone-500 font-medium">
            <p>{`Dues: ${formatCurrency(collection.amountPerUser)}`}</p>
            {collection.deadline && (
                <p className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                    Due: {formatDate(collection.deadline)}
                </p>
            )}
          </div>
        </div>
      </div>
      
      {collection.remittanceDetails?.isRemitted && (
        <div className="bg-green-50/60 backdrop-blur-sm border border-green-200/60 p-4 rounded-2xl my-6 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold text-green-800">
                Remitted on {formatTimestamp(collection.remittanceDetails.remittedAt)}.
              </p>
              <div className="mt-1 text-xs text-green-700 space-y-1 font-medium">
                 <p><span className="text-green-600">By:</span> {collection.remittanceDetails.remittedBy}</p>
                 <p><span className="text-green-600">Received:</span> {collection.remittanceDetails.receivedBy}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-stone-700 mb-4">Student Payments</h3>

        {/* Controls: Filters, Search, Bulk Actions */}
        <div className="mb-6 space-y-4">
            {/* Filter Buttons Row */}
            <div className="flex items-center p-1.5 bg-stone-200/30 backdrop-blur-sm rounded-full border border-white/20 overflow-x-auto max-w-fit">
                <div className="flex items-center space-x-1 flex-shrink-0">
                    <button onClick={() => setFilterStatus('all')} className={getFilterButtonClass('all')}>All</button>
                    <button onClick={() => setFilterStatus('paid')} className={getFilterButtonClass('paid')}>Paid</button>
                    <button onClick={() => setFilterStatus('unpaid')} className={getFilterButtonClass('unpaid')}>Unpaid</button>
                    <button onClick={() => setFilterStatus('balance')} className={getFilterButtonClass('balance')}>Balance</button>
                </div>
            </div>

            {/* Search and Bulk Actions Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-grow w-full sm:w-auto group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-stone-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-11 pr-10 py-3 border border-stone-200 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-all"
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
                <div className="flex items-center space-x-2 flex-shrink-0 flex-wrap justify-center gap-y-2">
                    <button onClick={() => setConfirmAction('paid')} className="px-4 py-2 text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 rounded-xl shadow-sm transition-colors border border-green-200">Mark All Paid</button>
                    <button onClick={() => setConfirmAction('unpaid')} className="px-4 py-2 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-xl shadow-sm transition-colors border border-blue-200">Mark All Unpaid</button>
                    <button
                        onClick={handleExport}
                        className="flex items-center px-4 py-2 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 rounded-xl shadow-sm transition-colors border border-stone-200"
                    >
                        <DownloadIcon className="h-4 w-4 mr-1.5"/>
                        Export
                    </button>
                </div>
            </div>
        </div>

        <UserList
            users={filteredUsers}
            collection={collection}
            paymentStatuses={paymentStatuses}
            onUpdateClick={handleOpenUpdateModal}
            onQuickSetPayment={(userId, amount) => onUpdatePayment(userId, collection.id, amount)}
            onViewProfile={onViewProfile}
        />
      </div>
      
      {confirmAction && (
        <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setConfirmAction(null)}
        >
            <div onClick={(e) => e.stopPropagation()}>
                <ConfirmationModal
                    title={`Confirm Bulk Action`}
                    message={`Are you sure you want to mark all ${users.length} students as ${confirmAction === 'paid' ? 'Paid' : 'Unpaid'} for this collection? This action cannot be undone.`}
                    onConfirm={() => {
                        onMarkAll(confirmAction === 'paid');
                        setConfirmAction(null);
                    }}
                    onCancel={() => setConfirmAction(null)}
                />
            </div>
        </div>
      )}

      {editingUser && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={handleCloseUpdateModal}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <UpdatePaymentForm
              user={editingUser}
              collection={collection}
              currentAmount={paymentStatuses[editingUser.id]?.[collection.id]?.paidAmount || 0}
              onSave={handleSavePayment}
              onClose={handleCloseUpdateModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetail;