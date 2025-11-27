import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { User, Collection, PaymentStatuses, AiGeneratedCollection, AppNotification, TreasurerProfile } from './types';
import { client as supabase } from './supabase';
import { db, firestore } from './firebase';
import Sidebar from './components/Sidebar';
import CollectionList from './components/CollectionList';
import CreateCollectionForm from './components/CreateCollectionForm';
import CollectionDetail from './components/CollectionDetail';
import StudentManagement from './components/MemberManagement';
import Dashboard from './components/Dashboard';
import AiCreateCollectionForm from './components/AiCreateCollectionForm';
import CollectionPreviewModal from './components/CollectionPreviewModal';
import ConfirmationModal from './components/ConfirmationModal';
import PaymentHistory from './components/PaymentHistory';
import UserProfileModal from './components/UserProfileModal';
import RemittanceForm from './components/RemittanceForm';
import MenuPage from './components/MenuPage';
import SettingsPage from './components/SettingsPage';
import NotificationBell from './components/NotificationBell';
import ProfilePage from './components/ProfilePage';
import RemittedList from './components/RemittedList';
import FloatingActionButton from './components/FloatingActionButton';
import AddCollectionChoiceModal from './components/AddCollectionChoiceModal';
import CashOnHandPage from './components/CashOnHandPage';
import ChatBot from './components/ChatBot';
import { PlusIcon, CollectionIcon, AiIcon, TrashIcon, PencilIcon, SearchIcon, XCircleIcon } from './components/Icons';

declare const XLSX: any;

const getFileParseSchema = () => ({
    type: Type.OBJECT,
    properties: {
      collectionName: { type: Type.STRING, description: 'The name of the collection. For multi-collection reports, this will be empty.' },
      amount: { type: Type.NUMBER, description: 'The default amount each student needs to pay. For multi-collection reports, this will be 0.' },
      deadline: { type: Type.STRING, description: 'The deadline in YYYY-MM-DD format. For multi-collection reports, this will be empty.' },
      treasurerName: { type: Type.STRING, description: 'The name of the treasurer from the footer.' },
      payments: {
        type: Type.ARRAY,
        description: 'A list of students who have paid. For multi-collection reports, this will be empty.',
        items: {
          type: Type.OBJECT,
          properties: {
            studentId: { type: Type.STRING, description: "The student's unique ID." },
            name: { type: Type.STRING, description: "The student's full name." },
            amount: { type: Type.NUMBER, description: 'The amount paid by the student.' },
            time: { type: Type.STRING, description: "The time of payment, e.g., '2:15 PM'. Can be 'N/A' or empty." },
            date: { type: Type.STRING, description: "The date of payment, e.g., '7/5/2024'. Can be 'N/A' or empty." },
          },
          required: ['studentId', 'name', 'amount', 'time', 'date'],
        },
      },
      hasHeader: { type: Type.BOOLEAN, description: 'True if a valid header for a single collection is found.' },
      hasBody: { type: Type.BOOLEAN, description: 'True if a valid student data table for a single collection is found.' },
      hasFooter: { type: Type.BOOLEAN, description: 'True if a treasurer verification footer is found.' },
      hasStudentData: { type: Type.BOOLEAN, description: 'True if the payments array is not empty.' },
      isRemitted: { type: Type.BOOLEAN, description: 'True if remittance details are found in the header.' },
      remittedBy: { type: Type.STRING, description: 'The name of the person who remitted the funds.' },
      receivedBy: { type: Type.STRING, description: 'The name of the person who received the funds.' },
      remittedDate: { type: Type.STRING, description: 'The date and time of remittance.' },
      isMultiCollectionReport: { type: Type.BOOLEAN, description: 'True if the file is a student data export with multiple collections as columns.' },
    },
    required: [
      'collectionName', 'amount', 'deadline', 'treasurerName', 'payments', 
      'hasHeader', 'hasBody', 'hasFooter', 'hasStudentData', 
      'isRemitted', 'remittedBy', 'receivedBy', 'remittedDate', 'isMultiCollectionReport'
    ],
});

const getFileParseSystemInstruction = (users: User[]) => {
    const userList = users.map(u => `${u.name} (ID: ${u.id})`).join(', ');
    return `You are an expert data parsing assistant for a class treasurer. You will be given the content of an XLSX file as a CSV string. Your task is to analyze the file content and determine its format, then extract data accordingly. There are three file types to consider: "Active Collection Report", "Remitted Collection Report", and "Multi-Collection Student Export".

**1. Identify File Type**

First, determine the file type.
- **Multi-Collection Student Export (Invalid for this task):** This file is for viewing student data across many collections. Its first row will contain headers like 'Student No', 'Student Name', followed by MULTIPLE collection names as column headers. If you identify this format, set 'isMultiCollectionReport' to true and all other fields to their default/empty values. Do not parse it further.
- **Single Collection Reports (Active or Remitted):** These files are for a single collection. They usually have a specific structure: a Header section at the top, a Body section with a table of student payments, and a Footer section at the bottom. Proceed with parsing these.

**2. Parsing Single Collection Reports (Active or Remitted)**

Be flexible with whitespace and capitalization.

**Header Section:**
- Look for key-value pairs. Essential keys are 'Collection Name:' and 'Deadline:'.
- An 'Amount per Student:' key might be present for collections with a fixed amount. If present, extract its value for the main 'amount' field. If this key is missing, it often means payment amounts vary per student; in this case, set the main 'amount' to 0.
- **Remittance Details:** A "Remitted Collection Report" will have extra header fields. The primary indicator is 'Status: Remitted'. Also look for 'Paid by:', 'Received by:', 'Date Remitted:', and 'Time Remitted:'.
- If remittance details are found, set 'isRemitted' to true and populate 'remittedBy', 'receivedBy', and 'remittedDate' (combine date and time).

**Body (Student Data Table):**
- Find a row with table headers. The essential headers are 'Student No' (or 'Student ID'), 'Student Name', and 'Amount Paid'.
- **CRITICAL:** The 'payments.amount' field in your JSON output for each student MUST come from the 'Amount Paid' column.
- The table may contain other columns like 'Amount to Pay', 'Status' (e.g., "Fully Paid", "Debit: ₱X.XX"), or custom fields (e.g., 'T-Shirt Size'). You MUST IGNORE these extra columns. Your task is only to extract the actual amount paid.
- The 'Student ID'/'Student No' column contains alphanumeric strings. It is CRITICAL to treat them as strings and preserve all characters, including leading zeros (e.g., '2024-001').
- For each student row in the table:
    - Extract 'studentId', 'name', and the numeric value from 'Amount Paid' for the 'amount' field.
    - Also extract 'time' and 'date' if those columns exist.
    - Trim whitespace from all string values.
    - The 'amount' in the payment record MUST be a number. If 'Amount Paid' is empty, non-numeric, or contains text, interpret it as 0.
    - If 'Time' or 'Date' columns are present but a cell is empty or 'N/A', return an empty string for that field.

**Footer Section:**
- Look for a footer at the end of the file. It can be in one of two formats:
    - Format A: A line starting with 'Verified by:' followed by the treasurer's name.
    - Format B: 'Treasurer's Name:' and 'Student ID:' on separate lines.
- Extract the treasurer's name from either format and populate 'treasurerName'.

**3. JSON Output Rules**

ALWAYS return a JSON object matching the provided schema.
- If 'isMultiCollectionReport' is true, set it, and return empty/default values for everything else.
- If it's a single collection report:
    - Populate 'collectionName', 'amount' (from header or 0), 'deadline', and 'treasurerName'. Use defaults if not found.
    - Populate the 'payments' array. If no students are listed, return an empty array.
    - Populate 'isRemitted' and other remittance fields if found.
    - Set boolean flags: 'hasHeader' (true if name and deadline found), 'hasBody' (true if student table headers found), 'hasFooter' (true if footer found), 'hasStudentData' (true if payments array is not empty).

**Contextual Information:**
- Today's date is ${new Date().toDateString()}.
- Available students are: ${userList}. Match student data against this list. If a student ID from the file does not match anyone, you must still include them in the 'payments' array. The client will handle validation.`;
};


function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatuses>({});
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isAiFormVisible, setIsAiFormVisible] = useState(false);
  const [isChoiceModalVisible, setIsChoiceModalVisible] = useState(false);
  const [aiSuggestionData, setAiSuggestionData] = useState<Partial<Omit<Collection, 'id'>> | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [selectedForDeletion, setSelectedForDeletion] = useState<string[]>([]);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'collections' | 'members' | 'history' | 'remitted' | 'menu' | 'settings' | 'profile' | 'cashOnHand'>('dashboard');
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<AiGeneratedCollection | null>(null);
  const [collectionSearchQuery, setCollectionSearchQuery] = useState('');
  const [remittedSearchQuery, setRemittedSearchQuery] = useState('');
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const [remittingCollection, setRemittingCollection] = useState<Collection | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [treasurerProfile, setTreasurerProfile] = useState<TreasurerProfile>({
      name: 'Treasurer',
      studentId: '2024-TREASURER',
      avatarUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAgMCAyMS43NSAxMmMwLTUuMzg1LTQuMzY1LTkuNzUtOS43NS05Ljc1UzIuMjUgNi42MTUgMi4yNSAxMmE5LjcyMyA5LjcyMyAwIDAgMCAzLjA2NSA3LjA5N0E5LjcxNiA5LjcxNiAwIDAgMCAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAgMCA2LjY4NS0yLjY1M1ptLTEyLjU0LTEuMjg1QTcuNDg2IDcuNDg2IDAgMCAxIDEyIDE1YTcuNDg2IDcuNDg2IDAgMCAxIDUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMCAxIDEyIDIwLjI1YTguMjI0IDguMjI0IDAgMCAxLTUuODU1LTIuNDM4Wk0xNS43NSA5YTMuNzUgMy43NSAwIDEgMS03LjUgMCAzLjc1IDMuNzUgMCAwIDEgNy41IDBaIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+Cg=='
  });

  const lastScrollY = useRef(0);

  const handleSaveProfile = async (profile: TreasurerProfile) => {
    try {
      const profileDocRef = db.collection('app_config').doc('treasurer_profile');
      await profileDocRef.set(profile, { merge: true });
      // The state will update via the listener, but this provides instant UI feedback
      setTreasurerProfile(profile); 
    } catch (error: unknown) {
      console.error('Failed to save profile:', error);
      addNotification('Error', 'Could not save your profile. Please try again.');
    }
  };


  // Effect for mobile nav bar visibility on scroll
  useEffect(() => {
    const SCROLL_THRESHOLD = 10;
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (Math.abs(currentScrollY - lastScrollY.current) < SCROLL_THRESHOLD) {
        return;
      }
      
      if (currentScrollY <= 0) {
        setIsMobileNavVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY.current) {
        setIsMobileNavVisible(false);
      } else {
        setIsMobileNavVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Effect for notifications state management
  useEffect(() => {
    const storedNotifications = localStorage.getItem('appNotifications');
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('appNotifications', JSON.stringify(notifications));
  }, [notifications]);
  
  const addNotification = (title: string, body: string, relatedCollectionId?: string) => {
    const newNotification: AppNotification = {
        id: `notif_${Date.now()}`,
        title,
        body,
        timestamp: Date.now(),
        read: false,
        relatedCollectionId,
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep latest 50
  };
  
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearReadNotifications = () => {
    setNotifications(prev => prev.filter(n => !n.read));
  };

  const handleNavigateToCollection = (collectionId: string) => {
    setActiveView('collections');
    setSelectedCollectionId(collectionId);
  };


  // Effect to fetch data from Supabase (users) and Firestore (collections, payments)
  useEffect(() => {
    setIsLoading(true);

    const defaultAvatarUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNjg1IDE5LjA5N0E5LjcyMyA5LjcyMyAwIDAgMCAyMS43NSAxMmMwLTUuMzg1LTQuMzY1LTkuNzUtOS43NS05Ljc1UzIuMjUgNi42MTUgMi4yNSAxMmE5LjcyMyA5LjcyMyAwIDAgMCAzLjA2NSA3LjA5N0E5LjcxNiA5LjcxNiAwIDAgMCAxMiAyMS43NWE5LjcxNiA5LjcxNiAwIDAgMCA2LjY4NS0yLjY1M1ptLTEyLjU0LTEuMjg1QTcuNDg2IDcuNDg2IDAgMCAxIDEyIDE1YTcuNDg2IDcuNDg2IDAgMCAxIDUuODU1IDIuODEyQTguMjI0IDguMjI0IDAgMCAxIDEyIDIwLjI1YTguMjI0IDguMjI0IDAgMCAxLTUuODU1LTIuNDM4Wk0xNS43NSA5YTMuNzUgMy43NSAwIDEgMS03LjUgMCAzLjc1IDMuNzUgMCAwIDEgNy41IDBaIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+';

    // 1. Fetch users from Supabase and set up real-time listeners
    const fetchAndSetUsers = async () => {
      const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('student_id, full_name, role, avatar_url');
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError.message);
        return;
      }
      if (profilesData) {
        const fetchedUsers: User[] = profilesData
          .filter((p: any) => p && typeof p.student_id === 'string' && p.student_id.trim() && typeof p.full_name === 'string' && p.full_name.trim())
          .map((p: any) => ({
            id: p.student_id,
            name: p.full_name,
            role: p.role || 'Member',
            avatarUrl: p.avatar_url || defaultAvatarUrl,
          }));
        setUsers(fetchedUsers);
      }
    };

    fetchAndSetUsers(); // Initial fetch

    const userChannel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload: any) => {
          const newUser: User = {
            id: payload.new.student_id,
            name: payload.new.full_name,
            role: payload.new.role || 'Member',
            avatarUrl: payload.new.avatar_url || defaultAvatarUrl,
          };
          if (newUser.id && newUser.name) {
            setUsers(currentUsers => [...currentUsers, newUser]);
            
            // Initialize student_funds for the new user
            const initializeNewUserFunds = async () => {
                const batch = db.batch();
                const userDocRef = db.collection('student_funds').doc(newUser.id);
                batch.set(userDocRef, { studentId: newUser.id, studentName: newUser.name });
  
                // Use the collections from the state at the time of execution
                setCollections(currentCollections => {
                    currentCollections.forEach(collection => {
                        const collectionDocRef = userDocRef.collection('collections').doc(collection.id);
                        batch.set(collectionDocRef, {
                            collectionName: collection.name,
                            amountDue: collection.amountPerUser,
                            deadline: collection.deadline || null,
                            paidAmount: 0,
                            status: 'Unpaid',
                            lastUpdated: firestore.FieldValue.serverTimestamp(),
                        });
                    });
                    batch.commit().catch(e => console.error('Error initializing funds for new user:', e));
                    return currentCollections;
                });
            };
            initializeNewUserFunds();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload: any) => {
          const updatedUser: User = {
            id: payload.new.student_id,
            name: payload.new.full_name,
            role: payload.new.role || 'Member',
            avatarUrl: payload.new.avatar_url || defaultAvatarUrl,
          };
          if (updatedUser.id && updatedUser.name) {
            setUsers(currentUsers => currentUsers.map(user =>
                user.id === updatedUser.id ? updatedUser : user
              ));
             // Update name in student_funds
             db.collection('student_funds').doc(updatedUser.id).update({
                studentName: updatedUser.name,
            }).catch(e => console.error('Error updating student name in funds:', e));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'profiles' },
        (payload: any) => {
            const deletedUserId = payload.old.student_id;
            setUsers(currentUsers => currentUsers.filter(user => user.id !== deletedUserId));

            // Delete user's student_funds document and its subcollection
            const deleteUserFunds = async () => {
                const userDocRef = db.collection('student_funds').doc(deletedUserId);
                const collectionsSnapshot = await userDocRef.collection('collections').get();
                
                const batch = db.batch();
                collectionsSnapshot.docs.forEach((doc: any) => {
                    batch.delete(doc.ref);
                });
                batch.delete(userDocRef);
                
                await batch.commit().catch(e => console.error('Error deleting user funds:', e));
            };
            deleteUserFunds();
        }
      )
      .subscribe();

    // 2. Set up Firestore real-time listener for collections
    const collectionsUnsubscribe = db.collection('collections')
      .onSnapshot((snapshot: any) => {
        const fetchedCollections: Collection[] = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        fetchedCollections.sort((a, b) => {
            const timeA = a.createdAt?.toDate()?.getTime() ?? 0;
            const timeB = b.createdAt?.toDate()?.getTime() ?? 0;

            if (timeA !== timeB) {
                return timeB - timeA;
            }
            
            // Fallback for items with no createdAt or same createdAt
            const deadlineA = a.deadline ? new Date(a.deadline).getTime() : 0;
            const deadlineB = b.deadline ? new Date(b.deadline).getTime() : 0;
            return deadlineB - deadlineA;
        });

        setCollections(fetchedCollections);
      }, (error) => {
        console.error("Error fetching collections:", error);
      });

    // 3. Set up Firestore real-time listener for payments
    const paymentsUnsubscribe = db.collection('payments')
      .onSnapshot((snapshot: any) => {
        const newPaymentStatuses: PaymentStatuses = {};
        snapshot.docs.forEach((doc: any) => {
          const payment = doc.data();
          if (!newPaymentStatuses[payment.userId]) {
            newPaymentStatuses[payment.userId] = {};
          }
          newPaymentStatuses[payment.userId][payment.collectionId] = {
            paidAmount: payment.paidAmount || 0,
            updatedAt: payment.updatedAt,
          };
        });
        setPaymentStatuses(newPaymentStatuses);
        setIsLoading(false); // Considered loaded after all data is fetched
      }, (error) => {
        console.error("Error fetching payments:", error);
        setIsLoading(false);
      });

    // 4. Set up Firestore real-time listener for treasurer profile
    const profileDocRef = db.collection('app_config').doc('treasurer_profile');
    const profileUnsubscribe = profileDocRef.onSnapshot((doc: any) => {
      if (doc.exists) {
        const profileData = doc.data() as TreasurerProfile;
        setTreasurerProfile(profileData);
      }
    }, (error) => {
      console.error("Error fetching treasurer profile:", error);
    });

    // Cleanup subscriptions on component unmount
    return () => {
      collectionsUnsubscribe();
      paymentsUnsubscribe();
      supabase.removeChannel(userChannel);
      profileUnsubscribe();
    };
  }, []);
  
  // Effect for deadline notifications using setInterval
    useEffect(() => {
        const checkDeadlines = () => {
            const areNotificationsGloballyEnabled = localStorage.getItem('areNotificationsGloballyEnabled') !== 'false';
            if (!areNotificationsGloballyEnabled) return;

            const reminderTiming = localStorage.getItem('deadlineReminderTiming');
            if (!reminderTiming || reminderTiming === 'none' || Notification.permission !== 'granted') {
                return;
            }

            let timeThresholdMs = 0;
            switch (reminderTiming) {
                case '10-min-before': timeThresholdMs = 10 * 60 * 1000; break;
                case '1-hour-before': timeThresholdMs = 60 * 60 * 1000; break;
                case '1-day-before': timeThresholdMs = 24 * 60 * 60 * 1000; break;
                case '2-days-before': timeThresholdMs = 2 * 24 * 60 * 60 * 1000; break;
            }

            const now = new Date();

            collections.forEach(collection => {
                const alreadyNotified = notifications.some(
                    n => n.relatedCollectionId === collection.id && n.title === 'Deadline Reminder'
                );

                if (collection.deadline && !alreadyNotified) {
                    const deadlineDate = new Date(collection.deadline);
                    // Set deadline to end of day for date-only strings
                    deadlineDate.setHours(23, 59, 59, 999);

                    const timeDiff = deadlineDate.getTime() - now.getTime();

                    if (timeDiff > 0 && timeDiff <= timeThresholdMs) {
                        const title = 'Deadline Reminder';
                        const body = `The collection "${collection.name}" is due soon.`;
                        new Notification(title, { body, icon: '/vite.svg', });
                        addNotification(title, body, collection.id);
                    }
                }
            });
        };

        const intervalId = setInterval(checkDeadlines, 5 * 60 * 1000); // Check every 5 minutes

        return () => clearInterval(intervalId);
    }, [collections, notifications]);

  const handleUpdatePayment = async (userId: string, collectionId: string, amount: number) => {
    const timestamp = firestore.FieldValue.serverTimestamp();

    const paymentQuery = await db.collection('payments')
      .where('userId', '==', userId)
      .where('collectionId', '==', collectionId)
      .limit(1)
      .get();
      
    if (paymentQuery.empty) {
      await db.collection('payments').add({
        userId,
        collectionId,
        paidAmount: amount,
        updatedAt: timestamp,
      }).catch((error: Error) => console.error("Error creating payment status: ", error));
    } else {
      const docId = paymentQuery.docs[0].id;
      await db.collection('payments').doc(docId).update({
        paidAmount: amount,
        updatedAt: timestamp,
      }).catch((error: Error) => console.error("Error updating payment status: ", error));
    }

    // Update student_funds collection
    try {
        const user = users.find(u => u.id === userId);
        const collection = collections.find(c => c.id === collectionId);
        if (!user || !collection) {
            console.error("User or collection not found for student_funds update.");
            return;
        }

        const studentFundDocRef = db.collection('student_funds').doc(userId);
        const studentFundCollectionRef = studentFundDocRef.collection('collections').doc(collectionId);

        const paidAmount = amount;
        const isFullyPaid = paidAmount >= collection.amountPerUser;
        const isPartiallyPaid = paidAmount > 0 && paidAmount < collection.amountPerUser;
        let status = 'Unpaid';
        if (isFullyPaid) status = 'Paid';
        else if (isPartiallyPaid) status = 'Partial';

        // Ensure the parent doc exists
        await studentFundDocRef.set({
            studentId: user.id,
            studentName: user.name,
        }, { merge: true });

        // Set the specific collection data
        await studentFundCollectionRef.set({
            collectionName: collection.name,
            amountDue: collection.amountPerUser,
            deadline: collection.deadline || null,
            paidAmount: paidAmount,
            status: status,
            lastUpdated: timestamp,
        });

        // Send notification if enabled
        const areNotificationsGloballyEnabled = localStorage.getItem('areNotificationsGloballyEnabled') !== 'false';
        const paymentNotificationsEnabled = localStorage.getItem('paymentNotifications') !== 'false';
        if (areNotificationsGloballyEnabled && paymentNotificationsEnabled && Notification.permission === 'granted') {
            const formatCurrency = (num: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num);
            const title = 'Payment Recorded';
            const body = `${user.name} paid ${formatCurrency(amount)} for "${collection.name}".`;
            new Notification(title, { body, icon: user.avatarUrl, });
            addNotification(title, body, collection.id);
        }

    } catch (error: unknown) {
        console.error("Error updating student_funds collection: ", error);
    }
  };


  const handleMarkAllStatus = async (collectionId: string, isPaid: boolean) => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) {
        console.error("Collection not found for bulk update");
        return;
    }
    const amountToSet = isPaid ? collection.amountPerUser : 0;
    const status = isPaid ? 'Paid' : 'Unpaid';

    const batch = db.batch();
    const timestamp = firestore.FieldValue.serverTimestamp();
    const userIds = users.map(u => u.id);

    if (userIds.length === 0) return;

    const existingPayments = new Map<string, string>(); // Map userId to docId

    // Firestore 'in' query supports up to 30 items, so we chunk the user IDs
    const chunks = [];
    for (let i = 0; i < userIds.length; i += 30) {
        chunks.push(userIds.slice(i, i + 30));
    }

    for (const chunk of chunks) {
        const paymentQuery = await db.collection('payments')
            .where('collectionId', '==', collectionId)
            .where('userId', 'in', chunk)
            .get();

        paymentQuery.docs.forEach((doc: any) => {
            const payment = doc.data();
            existingPayments.set(payment.userId, doc.id);
        });
    }

    users.forEach(user => {
        // Update 'payments' collection
        const docId = existingPayments.get(user.id);
        if (docId) {
            const docRef = db.collection('payments').doc(docId);
            batch.update(docRef, { paidAmount: amountToSet, updatedAt: timestamp });
        } else {
            const newDocRef = db.collection('payments').doc();
            batch.set(newDocRef, { userId: user.id, collectionId, paidAmount: amountToSet, updatedAt: timestamp });
        }

        // Update 'student_funds' collection
        const studentFundDocRef = db.collection('student_funds').doc(user.id);
        const studentFundCollectionRef = studentFundDocRef.collection('collections').doc(collectionId);
        
        batch.set(studentFundDocRef, {
            studentId: user.id,
            studentName: user.name,
        }, { merge: true });

        batch.set(studentFundCollectionRef, {
            collectionName: collection.name,
            amountDue: collection.amountPerUser,
            deadline: collection.deadline || null,
            paidAmount: amountToSet,
            status: status,
            lastUpdated: timestamp,
        });
    });

    try {
        await batch.commit();
    } catch (error: unknown) {
        console.error("Error performing bulk update: ", error);
    }
  };

  const handleSaveCollection = async (collectionData: Omit<Collection, 'id' | 'createdAt'>, id?: string, isSync: boolean = false) => {
    try {
      if (id) {
        // Update existing collection
        await db.collection('collections').doc(id).update(collectionData);
        
        // Update student_funds for all users to reflect collection changes
        const batch = db.batch();
        users.forEach(user => {
            const docRef = db.collection('student_funds').doc(user.id).collection('collections').doc(id);
            batch.update(docRef, {
                collectionName: collectionData.name,
                amountDue: collectionData.amountPerUser,
                deadline: collectionData.deadline || null,
            });
        });
        await batch.commit();

      } else {
        // Create new collection
        const dataWithTimestamp = {
            ...collectionData,
            createdAt: firestore.FieldValue.serverTimestamp()
        };
        const newCollectionRef = await db.collection('collections').add(dataWithTimestamp);
        const newCollectionId = newCollectionRef.id;

        // Initialize student_funds for all users for this new collection
        const batch = db.batch();
        const timestamp = firestore.FieldValue.serverTimestamp();
        users.forEach(user => {
            const studentFundDocRef = db.collection('student_funds').doc(user.id);
            const studentFundCollectionRef = studentFundDocRef.collection('collections').doc(newCollectionId);

            batch.set(studentFundDocRef, { studentId: user.id, studentName: user.name }, { merge: true });
            batch.set(studentFundCollectionRef, {
                collectionName: collectionData.name,
                amountDue: collectionData.amountPerUser,
                deadline: collectionData.deadline || null,
                paidAmount: 0,
                status: 'Unpaid',
                lastUpdated: timestamp,
            });
        });
        await batch.commit();

        // Send notification if enabled (and not part of a sync operation)
        if (!isSync) {
            const areNotificationsGloballyEnabled = localStorage.getItem('areNotificationsGloballyEnabled') !== 'false';
            const newCollectionNotificationsEnabled = localStorage.getItem('newCollectionNotifications') !== 'false';
            if (areNotificationsGloballyEnabled && newCollectionNotificationsEnabled) {
              const title = 'Collection Created';
              const body = `The collection "${collectionData.name}" has been added.`;
              addNotification(title, body, newCollectionId);
              if (Notification.permission === 'granted') {
                  new Notification(title, { body, icon: '/vite.svg', });
              }
            }
        }
      }
      if (!isSync) {
        handleCloseCreateForm();
      }
    } catch (error: unknown) {
      console.error("Error saving collection: ", error);
      throw error; // Re-throw for sync handler
    }
  };

  const handleUpdateRemittance = async (collectionId: string, remittedBy: string, receivedBy: string) => {
    const collectionRef = db.collection('collections').doc(collectionId);
    try {
      await collectionRef.update({
        remittanceDetails: {
          isRemitted: true,
          remittedBy,
          receivedBy,
          remittedAt: firestore.FieldValue.serverTimestamp(),
        }
      });
    } catch (error: unknown) {
      console.error("Error updating remittance status:", error);
    }
  };

  const handleOpenRemittanceForm = (collection: Collection) => {
    setRemittingCollection(collection);
  };

  const handleCloseRemittanceForm = () => {
    setRemittingCollection(null);
  };
  
  const handleAiSuggestion = (data: Omit<Collection, 'id'>) => {
    setAiSuggestionData(data);
    setIsAiFormVisible(false);
    setIsFormVisible(true);
  };
  
  const handleAiPreview = (data: AiGeneratedCollection) => {
    setPreviewData(data);
    setIsAiFormVisible(false);
    setIsPreviewVisible(true);
  };

  const createTimestampFromFile = (dateStr: string, timeStr: string): any => {
    if (!dateStr || !timeStr || dateStr.toLowerCase() === 'n/a' || timeStr.toLowerCase() === 'n/a' || dateStr.trim() === '' || timeStr.trim() === '') {
        return firestore.FieldValue.serverTimestamp();
    }
    try {
        const dateTimeString = `${dateStr} ${timeStr}`;
        const dateObj = new Date(dateTimeString);
        if (isNaN(dateObj.getTime())) {
            console.warn(`Could not parse date: "${dateTimeString}". Falling back to server timestamp.`);
            return firestore.FieldValue.serverTimestamp();
        }
        return firestore.Timestamp.fromDate(dateObj);
    } catch (error: unknown) {
        console.error("Error creating timestamp from file data:", error);
        return firestore.FieldValue.serverTimestamp();
    }
  };

  const handleConfirmCreateFromPreview = async (data: AiGeneratedCollection) => {
    try {
      // 1. Create the collection
      const newCollectionRef = await db.collection('collections').add({
        name: data.collectionName,
        amountPerUser: data.amount,
        deadline: data.deadline,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      const newCollectionId = newCollectionRef.id;

      // 2. Batch write the payments and student_funds, but only for valid students
      const batch = db.batch();
      const userMap = new Map(users.map(u => [u.id, u]));
      const validPayments = data.payments.filter(p => userMap.has(p.studentId));
      const usersWithPayments = new Set(validPayments.map(p => p.studentId));

      validPayments.forEach(paymentInfo => {
        const paymentTimestamp = createTimestampFromFile(paymentInfo.date, paymentInfo.time);

        // Add to 'payments' collection
        const newPaymentRef = db.collection('payments').doc();
        batch.set(newPaymentRef, {
          userId: paymentInfo.studentId,
          collectionId: newCollectionId,
          paidAmount: paymentInfo.amount,
          updatedAt: paymentTimestamp
        });
        
        // Add to 'student_funds' collection
        const user = users.find(u => u.id === paymentInfo.studentId);
        if(user) {
            const studentFundDocRef = db.collection('student_funds').doc(user.id);
            const studentFundCollectionRef = studentFundDocRef.collection('collections').doc(newCollectionId);
            const paidAmount = paymentInfo.amount;
            const isFullyPaid = paidAmount >= data.amount;
            const isPartiallyPaid = paidAmount > 0 && paidAmount < data.amount;
            let status = 'Unpaid';
            if (isFullyPaid) status = 'Paid';
            else if (isPartiallyPaid) status = 'Partial';

            batch.set(studentFundDocRef, { studentId: user.id, studentName: user.name }, { merge: true });
            batch.set(studentFundCollectionRef, {
                collectionName: data.collectionName,
                amountDue: data.amount,
                deadline: data.deadline || null,
                paidAmount: paidAmount,
                status: status,
                lastUpdated: paymentTimestamp,
            });
        }
      });

      // Handle users who were NOT in the uploaded file, setting them as unpaid
      const serverTimestamp = firestore.FieldValue.serverTimestamp();
      users.forEach(user => {
          if (!usersWithPayments.has(user.id)) {
              const studentFundDocRef = db.collection('student_funds').doc(user.id);
              const studentFundCollectionRef = studentFundDocRef.collection('collections').doc(newCollectionId);
              batch.set(studentFundDocRef, { studentId: user.id, studentName: user.name }, { merge: true });
              batch.set(studentFundCollectionRef, {
                  collectionName: data.collectionName,
                  amountDue: data.amount,
                  deadline: data.deadline || null,
                  paidAmount: 0,
                  status: 'Unpaid',
                  lastUpdated: serverTimestamp,
              });
          }
      });
      
      await batch.commit();

      // Send notification if enabled
      const areNotificationsGloballyEnabled = localStorage.getItem('areNotificationsGloballyEnabled') !== 'false';
      const newCollectionNotificationsEnabled = localStorage.getItem('newCollectionNotifications') !== 'false';
      if (areNotificationsGloballyEnabled && newCollectionNotificationsEnabled) {
        const title = 'Collection Created via AI';
        const body = `The collection "${data.collectionName}" has been added from your file.`;
        addNotification(title, body, newCollectionId);
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/vite.svg' });
        }
      }
      
      setIsPreviewVisible(false);
      setPreviewData(null);
      setSelectedCollectionId(newCollectionId);
      setActiveView('collections');


    } catch (error: unknown) {
      console.error("Error creating collection from preview:", error);
    }
  };
  
  const handleEditRequest = (collection: Collection) => {
    setEditingCollection(collection);
    setIsFormVisible(true);
  };
  
  const handleStartSelectionMode = (collectionId: string) => {
    setSelectedForDeletion([collectionId]);
  };

  const handleToggleSelection = (collectionId: string) => {
    setSelectedForDeletion(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const handleCancelSelection = () => {
    setSelectedForDeletion([]);
  };
  
  const handleEditSelected = () => {
    if (selectedForDeletion.length !== 1) return;
    const collection = collections.find(c => c.id === selectedForDeletion[0]);
    if (collection) {
      handleEditRequest(collection);
      handleCancelSelection();
    }
  };

  const handleConfirmDeleteSelected = async () => {
    const numToDelete = selectedForDeletion.length;
    if (numToDelete === 0) return;
  
    try {
      const batch = db.batch();
      
      // Query for all payments related to the collections to be deleted.
      if (selectedForDeletion.length > 0) {
          const paymentsQuery = await db.collection('payments')
              .where('collectionId', 'in', selectedForDeletion)
              .get();
          paymentsQuery.docs.forEach((doc: any) => {
              batch.delete(doc.ref);
          });
      }
      
      for (const collectionId of selectedForDeletion) {
          // Delete the collection itself
          const collectionRef = db.collection('collections').doc(collectionId);
          batch.delete(collectionRef);
  
          // Delete from student_funds for all users
          users.forEach(user => {
              const docRef = db.collection('student_funds').doc(user.id).collection('collections').doc(collectionId);
              batch.delete(docRef);
          });
      }
  
      await batch.commit();
      
      const title = `Collection${numToDelete > 1 ? 's' : ''} Deleted`;
      const body = `${numToDelete} collection${numToDelete > 1 ? 's' : ''} and associated payments were deleted.`;
      addNotification(title, body);
      // Also send a browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/vite.svg' });
      }

      setSelectedForDeletion([]);
      setIsDeleteConfirmVisible(false);
    } catch (error: unknown) {
      console.error("Error deleting collections and associated payments: ", error);
    }
  };

  const handleExportCollection = (collection: Collection) => {
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

    const bodyHeader = ['Student ID', 'Name', 'Amount paid', 'Time', 'Date'];

    const body = users.map(user => {
      const payment = paymentStatuses[user.id]?.[collection.id];
      const paidAmount = payment?.paidAmount ?? 0;
      const { date, time } = formatPaymentTimestamp(payment?.updatedAt);
      return [
        user.id,
        user.name,
        paidAmount,
        time,
        date,
      ];
    });

    const footer = [
      ['Verified by:', treasurerProfile.name]
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
      { wch: 20 }, // Student ID
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


  const handleCloseCreateForm = () => {
    setIsFormVisible(false);
    setAiSuggestionData(null);
    setEditingCollection(null);
  };

  const selectedCollection = collections.find(c => c.id === selectedCollectionId);
  const isSelectionModeActive = selectedForDeletion.length > 0;

  if (selectedCollection && (activeView === 'collections' || activeView === 'remitted')) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="w-full p-4 sm:p-6 lg:p-8">
            <CollectionDetail
            collection={selectedCollection}
            users={users}
            paymentStatuses={paymentStatuses}
            onUpdatePayment={handleUpdatePayment}
            onMarkAll={(isPaid) => handleMarkAllStatus(selectedCollection.id, isPaid)}
            onBack={() => setSelectedCollectionId(null)}
            onViewProfile={setViewingUser}
            />
        </main>
        {viewingUser && (
            <UserProfileModal
                user={viewingUser}
                collections={collections}
                paymentStatuses={paymentStatuses}
                onClose={() => setViewingUser(null)}
            />
        )}
      </div>
    );
  }

  const renderCollectionsView = () => {
    const activeCollections = collections.filter(c => !c.remittanceDetails?.isRemitted);
    const filteredCollections = activeCollections.filter(collection =>
        collection.name.toLowerCase().includes(collectionSearchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-start gap-4">
          <div className="relative w-full max-w-sm">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-500" />
              </div>
              <input
                  type="text"
                  placeholder="Search collections..."
                  value={collectionSearchQuery}
                  onChange={(e) => setCollectionSearchQuery(e.target.value)}
                  className="block w-full pl-11 pr-10 py-2 border border-slate-300 bg-white rounded-full shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
              />
              {collectionSearchQuery && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                        onClick={() => setCollectionSearchQuery('')}
                        className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label="Clear search"
                    >
                        <XCircleIcon className="h-5 w-5" />
                    </button>
                </div>
              )}
          </div>
        </div>

        {filteredCollections.length > 0 ? (
            <CollectionList 
                collections={filteredCollections} 
                users={users} 
                paymentStatuses={paymentStatuses}
                onSelectCollection={(id) => {
                    setSelectedCollectionId(id);
                }}
                selectedForDeletion={selectedForDeletion}
                onStartSelectionMode={handleStartSelectionMode}
                onToggleSelection={handleToggleSelection}
                onOpenRemittanceForm={handleOpenRemittanceForm}
                onExportCollection={handleExportCollection}
            />
        ) : (
             <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <CollectionIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-lg font-medium text-slate-900">{collections.length > 0 ? 'No collections found' : 'No collections yet'}</h3>
                <p className="mt-1 text-sm text-slate-600">{collections.length > 0 ? 'Try a different search term.' : 'Get started by creating a new collection using the + button below.'}</p>
            </div>
        )}
      </div>
    );
  }

  const renderRemittedView = () => {
    const remittedCollections = collections.filter(c => c.remittanceDetails?.isRemitted);
    const filteredRemittedCollections = remittedCollections.filter(collection =>
      collection.name.toLowerCase().includes(remittedSearchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-start gap-4">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search remitted collections..."
              value={remittedSearchQuery}
              onChange={(e) => setRemittedSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-10 py-2 border border-slate-300 bg-white rounded-full shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
            />
            {remittedSearchQuery && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  onClick={() => setRemittedSearchQuery('')}
                  className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label="Clear search"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
        <RemittedList
          collections={filteredRemittedCollections}
          users={users}
          paymentStatuses={paymentStatuses}
          onSelectCollection={(id) => {
            setSelectedCollectionId(id);
          }}
          selectedForDeletion={selectedForDeletion}
          onStartSelectionMode={handleStartSelectionMode}
          onToggleSelection={handleToggleSelection}
        />
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 animate-spin"></div>
          <p className="ml-4 text-gray-600">Loading data...</p>
        </div>
      );
    }
    
    switch (activeView) {
        case 'dashboard':
            return <Dashboard 
                        users={users}
                        collections={collections}
                        paymentStatuses={paymentStatuses}
                        onNavigate={setActiveView}
                    />;
        case 'collections':
            return renderCollectionsView();
        case 'remitted':
            return renderRemittedView();
        case 'members':
            return <StudentManagement 
                      users={users}
                      onViewProfile={setViewingUser}
                    />;
        case 'history':
            return <PaymentHistory
                      users={users}
                      collections={collections}
                      paymentStatuses={paymentStatuses}
                    />;
        case 'menu':
            return <MenuPage 
                      setActiveView={setActiveView} 
                    />;
        case 'profile':
            return <ProfilePage
                        users={users}
                        collections={collections}
                        paymentStatuses={paymentStatuses}
                        treasurerProfile={treasurerProfile}
                        onSaveProfile={handleSaveProfile}
                        onBack={() => setActiveView('menu')}
                    />;
        case 'settings':
            return <SettingsPage 
                        users={users}
                        collections={collections}
                        paymentStatuses={paymentStatuses}
                        onBack={() => setActiveView('menu')}
                    />;
        case 'cashOnHand':
            return <CashOnHandPage
                        users={users}
                        collections={collections}
                        paymentStatuses={paymentStatuses}
                        onBack={() => setActiveView('menu')}
                    />;
        default:
            return null;
    }
  };
  
  const getPageTitle = () => {
    switch(activeView) {
      case 'dashboard': return 'Dashboard Overview';
      case 'collections': return 'Manage Collections';
      case 'remitted': return 'Remitted Collections';
      case 'members': return 'Student Roster';
      case 'history': return 'Payment History';
      case 'menu': return 'Menu';
      case 'profile': return 'Your Profile';
      case 'settings': return 'Application Settings';
      case 'cashOnHand': return 'Cash on Hand';
      default: return "Treasurer's Portal";
    }
  };

  const isModalOpen = isChoiceModalVisible || isFormVisible || isAiFormVisible || isPreviewVisible || isDeleteConfirmVisible || !!viewingUser || !!remittingCollection || isChatVisible;

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        activeView={activeView}
        setActiveView={setActiveView}
        setSelectedCollectionId={setSelectedCollectionId}
        isMobileNavVisible={isMobileNavVisible}
      />
      <div className="flex-1 flex flex-col md:ml-64">
        <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-30 border-b border-slate-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold leading-tight text-gray-900">
              {getPageTitle()}
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsChatVisible(true)}
                className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Open AI Assistant"
              >
                <AiIcon className="h-7 w-7" />
              </button>
              <NotificationBell 
                  notifications={notifications}
                  onMarkAsRead={markNotificationAsRead}
                  onMarkAllAsRead={markAllNotificationsAsRead}
                  onClearRead={handleClearReadNotifications}
                  onNavigateToCollection={handleNavigateToCollection}
              />
            </div>
          </div>
        </header>
        <main className={`flex-1 transition-all duration-300 ${isSelectionModeActive ? 'pb-36' : 'pb-20'} md:pb-0`}>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* User Profile Modal */}
      {viewingUser && (
        <UserProfileModal
            user={viewingUser}
            collections={collections}
            paymentStatuses={paymentStatuses}
            onClose={() => setViewingUser(null)}
        />
      )}

      {/* Remittance Modal */}
      {remittingCollection && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={handleCloseRemittanceForm}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <RemittanceForm
              onSave={(remittedBy, receivedBy) => {
                handleUpdateRemittance(remittingCollection.id, remittedBy, receivedBy);
                handleCloseRemittanceForm();
              }}
              onClose={handleCloseRemittanceForm}
              defaultRemittedBy={treasurerProfile.name}
            />
          </div>
        </div>
      )}

      {/* Add Collection Choice Modal */}
      {isChoiceModalVisible && (
        <AddCollectionChoiceModal
          onClose={() => setIsChoiceModalVisible(false)}
          onManualCreate={() => {
            setIsChoiceModalVisible(false);
            setIsFormVisible(true);
          }}
          onAiCreate={() => {
            setIsChoiceModalVisible(false);
            setIsAiFormVisible(true);
          }}
        />
      )}
      
      {/* AI Create Collection Modal */}
      {isAiFormVisible && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 animate-fade-in"
          aria-modal="true"
          role="dialog"
          onClick={() => setIsAiFormVisible(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AiCreateCollectionForm 
              onSuggest={handleAiSuggestion}
              onPreview={handleAiPreview} 
              onClose={() => setIsAiFormVisible(false)}
              users={users}
            />
          </div>
        </div>
      )}
      
      {/* AI Preview Modal */}
      {isPreviewVisible && previewData && (
        <CollectionPreviewModal
            data={previewData}
            users={users}
            onConfirm={() => handleConfirmCreateFromPreview(previewData)}
            onCancel={() => setIsPreviewVisible(false)}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteConfirmVisible && (
        <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setIsDeleteConfirmVisible(false)}
        >
            <div onClick={(e) => e.stopPropagation()}>
                <ConfirmationModal
                    title={`Delete Collection${selectedForDeletion.length > 1 ? 's' : ''}`}
                    message={`Are you sure you want to delete the ${selectedForDeletion.length} selected collection${selectedForDeletion.length > 1 ? 's' : ''}? This will also remove all associated payment records. This action cannot be undone.`}
                    onConfirm={handleConfirmDeleteSelected}
                    onCancel={() => setIsDeleteConfirmVisible(false)}
                />
            </div>
        </div>
      )}

      {/* Create / Edit Collection Modal */}
      {isFormVisible && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center animate-fade-in"
          aria-modal="true"
          role="dialog"
          onClick={handleCloseCreateForm}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto">
            <CreateCollectionForm 
              onSaveCollection={handleSaveCollection} 
              onClose={handleCloseCreateForm}
              initialData={aiSuggestionData}
              collectionToEdit={editingCollection}
            />
          </div>
        </div>
      )}

       {/* AI Chat Modal */}
       {isChatVisible && (
        <ChatBot
          users={users}
          collections={collections}
          paymentStatuses={paymentStatuses}
          onClose={() => setIsChatVisible(false)}
          treasurerProfile={treasurerProfile}
        />
      )}

      {/* Floating Action Button for Collections view */}
      {activeView === 'collections' && !isSelectionModeActive && !isModalOpen && (
        <FloatingActionButton
          onClick={() => setIsChoiceModalVisible(true)}
          isMobileNavVisible={isMobileNavVisible}
        />
      )}

      {/* Selection Action Bar */}
      {isSelectionModeActive && (activeView === 'collections' || activeView === 'remitted') && (
        <div 
            className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white z-30 p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] animate-fade-in md:ml-64"
            style={{ animationDuration: '200ms'}}
        >
            <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
                <span className="text-gray-800 font-semibold">
                    {selectedForDeletion.length} selected
                </span>
                <div className="flex space-x-3">
                    <button 
                        onClick={handleCancelSelection}
                        className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    {selectedForDeletion.length === 1 && activeView === 'collections' && (
                        <button
                            onClick={handleEditSelected}
                            className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
                        >
                           <PencilIcon className="w-4 h-4 mr-2"/> Edit
                        </button>
                    )}
                    <button 
                        onClick={() => setIsDeleteConfirmVisible(true)}
                        className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;