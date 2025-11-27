import React from 'react';
import type { Collection, User, PaymentStatuses } from '../types';
import CollectionListItem from './CollectionListItem';
import { CollectionIcon } from './Icons';

interface CollectionListProps {
  collections: Collection[];
  users: User[];
  paymentStatuses: PaymentStatuses;
  onSelectCollection: (collectionId: string) => void;
  selectedForDeletion: string[];
  onStartSelectionMode: (collectionId: string) => void;
  onToggleSelection: (collectionId: string) => void;
  onOpenRemittanceForm: (collection: Collection) => void;
  onExportCollection: (collection: Collection) => void;
}

const CollectionList: React.FC<CollectionListProps> = ({ 
  collections, 
  users, 
  paymentStatuses, 
  onSelectCollection, 
  selectedForDeletion, 
  onStartSelectionMode, 
  onToggleSelection,
  onOpenRemittanceForm,
  onExportCollection
}) => {
  if (collections.length === 0) {
    return null;
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
    <div className="bg-white/40 backdrop-blur-2xl border border-white/50 p-6 rounded-[2rem] shadow-xl shadow-stone-200/20">
       <div className="flex items-center mb-6 pl-2">
        <CollectionIcon className="h-6 w-6 text-blue-500" />
        <h2 className="text-xl font-bold text-stone-800 ml-3 tracking-tight">Active Collections</h2>
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
              onOpenRemittanceForm={onOpenRemittanceForm}
              onExport={onExportCollection}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CollectionList;