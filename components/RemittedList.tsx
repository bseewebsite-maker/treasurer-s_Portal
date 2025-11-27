import React from 'react';
import type { Collection, User, PaymentStatuses } from '../types';
import CollectionListItem from './CollectionListItem';
import { BanknotesIcon } from './Icons';

interface RemittedListProps {
  collections: Collection[];
  users: User[];
  paymentStatuses: PaymentStatuses;
  onSelectCollection: (collectionId: string) => void;
  selectedForDeletion: string[];
  onStartSelectionMode: (collectionId: string) => void;
  onToggleSelection: (collectionId: string) => void;
}

const RemittedList: React.FC<RemittedListProps> = ({ 
  collections, 
  users, 
  paymentStatuses, 
  onSelectCollection,
  selectedForDeletion,
  onStartSelectionMode,
  onToggleSelection
}) => {
  if (collections.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <BanknotesIcon className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-lg font-medium text-slate-900">No Remitted Collections</h3>
        <p className="mt-1 text-sm text-slate-600">Collections you mark as remitted will appear here.</p>
      </div>
    );
  }

  const getCollectionStats = (collection: Collection) => {
    let paidCount = 0;
    let amountCollected = 0;
    
    users.forEach(user => {
      const paidAmount = paymentStatuses[user.id]?.[collection.id]?.paidAmount ?? 0;
      if (paidAmount >= collection.amountPerUser) {
        paidCount++;
      }
      amountCollected += paidAmount;
    });
    return { paidCount, amountCollected };
  };

  const isSelectionModeActive = selectedForDeletion.length > 0;

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm animate-fade-in">
       <div className="flex items-center mb-4">
        <BanknotesIcon className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-bold text-gray-800 ml-2">Archived Remittances</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {collections.map(collection => {
          const stats = getCollectionStats(collection);
          return (
            <CollectionListItem 
              key={collection.id} 
              collection={collection} 
              paidCount={stats.paidCount}
              amountCollected={stats.amountCollected}
              totalCount={users.length}
              onSelect={onSelectCollection}
              isSelectionModeActive={isSelectionModeActive}
              isSelected={selectedForDeletion.includes(collection.id)}
              onStartSelectionMode={onStartSelectionMode}
              onToggleSelection={onToggleSelection}
              onOpenRemittanceForm={() => {}} // This will not be called, but the prop is required
            />
          );
        })}
      </div>
    </div>
  );
};

export default RemittedList;