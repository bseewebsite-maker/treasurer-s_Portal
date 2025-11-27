// Fix: Populating the types.ts file with all the necessary type definitions.
export interface User {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export interface TreasurerProfile {
  name: string;
  studentId: string;
  avatarUrl: string;
}

export interface RemittanceDetails {
  isRemitted: boolean;
  remittedBy: string;
  receivedBy: string;
  remittedAt: any; // Firestore Timestamp
}

export interface Collection {
  id: string;
  name: string;
  amountPerUser: number;
  deadline?: string;
  remittanceDetails?: RemittanceDetails;
  createdAt?: any; // Firestore Timestamp
}

export interface PaymentStatus {
  paidAmount: number;
  updatedAt: any; // Can be a Firestore Timestamp
}

export type PaymentStatuses = {
  [userId: string]: {
    [collectionId: string]: PaymentStatus;
  };
};

export interface AiGeneratedPayment {
  studentId: string;
  name: string;
  amount: number;
  time: string;
  date: string;
}

export interface AiGeneratedCollection {
  collectionName: string;
  amount: number;
  deadline: string;
  treasurerName: string;
  payments: AiGeneratedPayment[];
  hasHeader: boolean;
  hasBody: boolean;
  hasFooter: boolean;
  hasStudentData: boolean;
  isRemitted: boolean;
  remittedBy: string;
  receivedBy: string;
  remittedDate: string;
  isMultiCollectionReport: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  relatedCollectionId?: string;
}