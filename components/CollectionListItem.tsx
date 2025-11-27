import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { Collection } from '../types';
import { CheckCircleIcon, BanknotesIcon, DownloadIcon } from './Icons';

interface CollectionListItemProps {
  collection: Collection;
  paidCount: number;
  amountCollected: number;
  totalCount: number;
  onSelect: (collectionId: string) => void;
  isSelectionModeActive: boolean;
  isSelected: boolean;
  onToggleSelection: (collectionId: string) => void;
  onStartSelectionMode: (collectionId: string) => void;
  onOpenRemittanceForm: (collection: Collection) => void;
  onExport: (collection: Collection) => void;
}

const SWIPE_ACTION_WIDTH = 80; // px

const CollectionListItem: React.FC<CollectionListItemProps> = ({ 
  collection, 
  paidCount, 
  amountCollected, 
  totalCount, 
  onSelect, 
  isSelectionModeActive, 
  isSelected, 
  onToggleSelection, 
  onStartSelectionMode,
  onOpenRemittanceForm,
  onExport
}) => {
  const pressTimer = useRef<number | null>(null);
  const isLongPress = useRef(false);
  const hasMoved = useRef(false);
  const MOVE_THRESHOLD = 10;

  const [translateX, setTranslateX] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const currentTranslateX = useRef(0);
  const isDragging = useRef(false);

  const actionsWidth = useMemo(() => {
    let width = SWIPE_ACTION_WIDTH; // Export button
    if (!collection.remittanceDetails?.isRemitted) {
      width += SWIPE_ACTION_WIDTH; // Remit button
    }
    return width;
  }, [collection.remittanceDetails]);

  const clearTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleDragStart = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (isSelectionModeActive) return;
    
    isDragging.current = false;
    isLongPress.current = false;
    hasMoved.current = false;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartPos.current = { x: clientX, y: clientY };
    currentTranslateX.current = translateX;

    pressTimer.current = window.setTimeout(() => {
      if (!hasMoved.current) {
        isLongPress.current = true;
        onStartSelectionMode(collection.id);
      }
    }, 500);
  };

  const handleDragMove = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (!dragStartPos.current || isSelectionModeActive) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragStartPos.current.x;
    const deltaY = clientY - dragStartPos.current.y;

    if (!isDragging.current && (Math.abs(deltaX) > MOVE_THRESHOLD || Math.abs(deltaY) > MOVE_THRESHOLD)) {
      hasMoved.current = true;
      clearTimer();
    }
    
    if (!isDragging.current && Math.abs(deltaY) > Math.abs(deltaX)) {
      dragStartPos.current = null;
      return;
    }

    if (Math.abs(deltaX) > MOVE_THRESHOLD) {
      isDragging.current = true;
    }
    
    if (isDragging.current) {
      const newTranslateX = currentTranslateX.current + deltaX;
      if (newTranslateX < 50) { // Allow slight rightward movement for rubber-band effect, but mostly left
        setTranslateX(Math.max(-actionsWidth, newTranslateX));
      }
    }
  };

  const handleDragEnd = () => {
    clearTimer();
    if (!dragStartPos.current) return;
    dragStartPos.current = null;

    if (!isDragging.current) return;
    
    const threshold = -actionsWidth / 2;
    if (translateX < threshold) {
      setTranslateX(-actionsWidth);
    } else {
      setTranslateX(0);
    }
  };

  const handleClick = () => {
    if (isDragging.current || hasMoved.current) return;
    
    if (isSelectionModeActive) {
      onToggleSelection(collection.id);
    } else if (!isLongPress.current) {
      onSelect(collection.id);
    }
  };

  useEffect(() => {
    if (!isSelectionModeActive) {
      setTranslateX(0);
    }
  }, [isSelectionModeActive]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(event.target as Node)) {
        setTranslateX(0);
      }
    };
    if (translateX !== 0) {
      document.addEventListener('mousedown', handleOutsideClick, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick, true);
    };
  }, [translateX]);
  
  const handleRemitClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenRemittanceForm(collection);
    setTranslateX(0);
  };
  
  const handleExportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExport(collection);
    setTranslateX(0);
  };

  const totalAmount = totalCount * collection.amountPerUser;
  const progressPercentage = Math.min(100, totalAmount > 0 ? (amountCollected / totalAmount) * 100 : 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isFullyPaid = totalCount > 0 && paidCount === totalCount;

  return (
    <div className="relative rounded-3xl shadow-xl shadow-stone-200/40 overflow-hidden bg-stone-100" ref={itemRef}>
      {/* Action Buttons Layer (z-0) */}
      <div className="absolute top-0 right-0 h-full flex z-0">
         {!collection.remittanceDetails?.isRemitted && (
          <button onClick={handleRemitClick} className="h-full w-20 flex flex-col items-center justify-center bg-green-500 text-white transition-colors hover:bg-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-400">
            <BanknotesIcon className="h-6 w-6"/>
            <span className="text-xs mt-1 font-medium">Remit</span>
          </button>
        )}
        <button onClick={handleExportClick} className="h-full w-20 flex flex-col items-center justify-center bg-blue-500 text-white transition-colors hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400">
          <DownloadIcon className="h-6 w-6"/>
          <span className="text-xs mt-1 font-medium">Export</span>
        </button>
      </div>

      {/* Main Content Layer (z-10) - Solid White Background */}
      <div
        className="relative z-10 h-full transition-transform duration-300 ease-[cubic-bezier(0.23, 1, 0.32, 1)] bg-white"
        style={{ transform: `translateX(${translateX}px)` }}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onClick={handleClick}
      >
        <div
          role="button"
          aria-label={`Collection: ${collection.name}`}
          className={`h-full border p-6 rounded-3xl flex flex-col justify-between text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 transition-all duration-300 select-none ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10 bg-blue-50/30' : 'border-stone-100 bg-white'} ${!isSelectionModeActive ? 'hover:shadow-2xl hover:shadow-stone-200/60' : ''}`}
        >
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-stone-800 truncate pr-2 tracking-tight">
                {collection.name}
              </h3>
              <div className="flex-shrink-0 flex items-center space-x-2">
                {isFullyPaid && (
                    <span className="inline-block px-2.5 py-1 text-xs font-bold text-green-700 bg-green-100/60 rounded-full border border-green-200/50">
                        Paid
                    </span>
                )}
                {collection.remittanceDetails?.isRemitted && (
                    <BanknotesIcon className="h-5 w-5 text-green-600" title="Remitted" />
                )}
              </div>
            </div>
            <p className="text-sm text-stone-500 font-medium">{`Dues: ${formatCurrency(collection.amountPerUser)}`}</p>
            {collection.deadline && (
                <p className="text-xs text-blue-600 font-semibold mt-1">
                    Due: {formatDate(collection.deadline)}
                </p>
            )}
          </div>
          
          <div className="mt-6">
              <div className="w-full bg-stone-100 rounded-full h-2.5 mb-3 overflow-hidden">
                  <div 
                  className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2.5 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                  style={{ width: `${progressPercentage}%` }}
                  ></div>
              </div>
              <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-stone-800">{formatCurrency(amountCollected)}</span>
                  <span className="text-stone-400 font-medium text-xs">of {formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center mt-1 text-xs">
                <p className="text-stone-400 font-medium">{`${paidCount} / ${totalCount} paid`}</p>
              </div>
          </div>
           {isSelected && (
            <div 
              className="absolute top-4 right-4 z-20 pointer-events-none animate-fade-in"
              style={{ animationDuration: '150ms' }}
            >
              <CheckCircleIcon className="h-6 w-6 text-blue-500 drop-shadow-sm" fill="white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionListItem;