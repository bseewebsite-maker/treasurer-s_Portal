import React, { useRef } from 'react';
import { CheckCircleIcon, ChevronRightIcon } from './Icons';

// Types for offline data structure
interface OfflineCollectionEntry {
    tempId: string;
    collectionData: {
        name: string;
        amountPerUser: number;
        deadline?: string;
    };
    payments: { paidAmount: number }[];
    synced?: boolean;
}

interface OfflineCollectionListItemProps {
  collectionEntry: OfflineCollectionEntry;
  onSelect: () => void;
  isSelectionModeActive: boolean;
  isSelected: boolean;
  onToggleSelection: (tempId: string) => void;
  onStartSelectionMode: (tempId: string) => void;
  totalUsers: number;
}

const OfflineCollectionListItem: React.FC<OfflineCollectionListItemProps> = ({ 
  collectionEntry, 
  onSelect, 
  isSelectionModeActive, 
  isSelected, 
  onToggleSelection, 
  onStartSelectionMode,
  totalUsers,
}) => {
  const pressTimer = useRef<number | null>(null);
  const isLongPress = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);
  const MOVE_THRESHOLD = 10; // pixels

  const clearTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePressStart = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    isLongPress.current = false;
    hasMoved.current = false;
    
    if ('touches' in e) {
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      startPos.current = { x: e.clientX, y: e.clientY };
    }

    pressTimer.current = window.setTimeout(() => {
      if (!hasMoved.current) {
        isLongPress.current = true;
        onStartSelectionMode(collectionEntry.tempId);
      }
    }, 500);
  };

  const handlePressEnd = () => {
    clearTimer();
    startPos.current = null;
  };
  
  const handleMove = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (startPos.current && !hasMoved.current) {
      let currentX: number, currentY: number;
      if ('touches' in e) {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
      } else {
        currentX = e.clientX;
        currentY = e.clientY;
      }

      const deltaX = Math.abs(currentX - startPos.current.x);
      const deltaY = Math.abs(currentY - startPos.current.y);

      if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
        hasMoved.current = true;
        clearTimer();
      }
    }
  };

  const handleClick = () => {
    if (hasMoved.current) return;
    
    if (isSelectionModeActive) {
      onToggleSelection(collectionEntry.tempId);
    } else if (!isLongPress.current) {
      onSelect();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
  };

  const paidCount = collectionEntry.payments.filter(
    p => p.paidAmount >= collectionEntry.collectionData.amountPerUser
  ).length;
  const isFullyPaid = totalUsers > 0 && paidCount === totalUsers;

  return (
    <div
        className="relative select-none"
        onClick={handleClick}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onMouseMove={handleMove}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchMove={handleMove}
    >
        <div
            className={`flex items-center w-full text-left p-4 transition-all duration-200 cursor-pointer border ${
            isSelected 
                ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500 scale-105 shadow-lg' 
                : 'bg-white/50 border-white/30 hover:bg-white/80 hover:shadow-md'
            } rounded-xl`}
        >
            {isSelectionModeActive && (
                 <div className="mr-4">
                    {isSelected ? (
                         <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                    ) : (
                        <div className="h-6 w-6 border-2 border-gray-300 rounded-full"></div>
                    )}
                </div>
            )}
            <div className="flex-grow min-w-0">
                <h3 className="text-md font-semibold text-gray-800 truncate">
                    {collectionEntry.collectionData.name}
                </h3>
                {collectionEntry.collectionData.deadline && (
                    <p className="text-xs text-red-600 font-medium mt-1">
                        Deadline: {formatDate(collectionEntry.collectionData.deadline)}
                    </p>
                )}
            </div>
            <div className="flex-shrink-0 ml-4 flex items-center space-x-3">
                {isFullyPaid && (
                    <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100/80 text-green-800">
                        Fully Paid
                    </span>
                 )}
                 <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${collectionEntry.synced ? 'bg-green-100/80 text-green-800' : 'bg-yellow-100/80 text-yellow-800'}`}>
                    {collectionEntry.synced ? 'Synced' : 'Pending'}
                </span>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
        </div>
    </div>
  );
};

export default OfflineCollectionListItem;