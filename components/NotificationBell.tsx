import React, { useState, useRef, useEffect } from 'react';
import type { AppNotification } from '../types';
import { BellIcon } from './Icons';

interface NotificationBellProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearRead: () => void;
  onNavigateToCollection: (collectionId: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead, onClearRead, onNavigateToCollection }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const hasReadNotifications = notifications.some(n => n.read);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    if (seconds < 5) return "just now";
    return Math.floor(seconds) + "s ago";
  };
  
  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read) {
        onMarkAsRead(notification.id);
    }
    // Only navigate if there's a related ID, but always mark as read on click
    if (notification.relatedCollectionId) {
        onNavigateToCollection(notification.relatedCollectionId);
    }
    // Close menu only if navigating
    if (notification.relatedCollectionId) {
        setIsOpen(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="View notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex justify-center items-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
            className="origin-top-right absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl shadow-2xl bg-white border border-slate-200 focus:outline-none z-50 animate-fade-in"
            style={{ animationDuration: '150ms' }}
        >
          <div className="p-3 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 className="text-md font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-3">
              {hasReadNotifications && (
                  <button 
                      onClick={onClearRead}
                      className="text-xs font-medium text-blue-600 hover:underline"
                  >
                      Clear Read
                  </button>
              )}
              {unreadCount > 0 && (
                  <button 
                      onClick={onMarkAllAsRead} 
                      className="text-xs font-medium text-blue-600 hover:underline"
                  >
                      Mark all as read
                  </button>
              )}
            </div>
          </div>
          {notifications.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {notifications.map(notification => (
                <li key={notification.id} className={`transition-opacity duration-300 ${notification.read ? 'opacity-60' : 'opacity-100'}`}>
                  <button 
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-3 transition-colors duration-200 group ${!notification.read ? 'bg-blue-50/70' : 'bg-transparent'} hover:bg-slate-50`}
                  >
                    <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">{notification.title}</p>
                        {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1 ml-2 ring-2 ring-blue-500/20"></div>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatTimeAgo(notification.timestamp)}</p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
             <div className="p-8 text-center text-sm text-gray-500">
                <BellIcon className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-3 font-medium text-gray-600">All caught up!</p>
                <p className="text-xs mt-1">You have no new notifications.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;