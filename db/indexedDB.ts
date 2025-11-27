import type { User } from '../types';

const DB_NAME = 'TreasurerPortalDB';
const DB_VERSION = 1;
const USER_STORE = 'users';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(USER_STORE)) {
        dbInstance.createObjectStore(USER_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const saveUsersToDB = async (users: User[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(USER_STORE, 'readwrite');
    const store = transaction.objectStore(USER_STORE);
    
    // Clear existing data
    const clearRequest = store.clear();
    
    clearRequest.onerror = () => reject('Failed to clear user store');

    clearRequest.onsuccess = () => {
        // Add new data
        users.forEach(user => {
            store.put(user);
        });

        transaction.oncomplete = () => {
            localStorage.setItem('lastUserSyncTimestamp', new Date().toISOString());
            resolve();
        };

        transaction.onerror = () => {
            console.error('Transaction error:', transaction.error);
            reject('Error saving users');
        };
    }
  });
};

export const getUsersFromDB = async (): Promise<User[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(USER_STORE, 'readonly');
    const store = transaction.objectStore(USER_STORE);
    const request = store.getAll();

    request.onerror = () => {
      console.error('Request error:', request.error);
      reject('Error fetching users');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
};