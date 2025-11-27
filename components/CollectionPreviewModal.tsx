import React, { useMemo } from 'react';
import type { AiGeneratedCollection, User } from '../types';
import { CheckCircleIcon, XCircleIcon } from './Icons';

interface CollectionPreviewModalProps {
  data: AiGeneratedCollection;
  users: User[];
  onConfirm: () => void;
  onCancel: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    // Add time component to ensure date is parsed correctly across timezones
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const CollectionPreviewModal: React.FC<CollectionPreviewModalProps> = ({ data, users, onConfirm, onCancel }) => {
  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const validPayments = useMemo(() => data.payments.filter(p => userMap.has(p.studentId)), [data.payments, userMap]);
  const unrecognizedPayments = useMemo(() => data.payments.filter(p => !userMap.has(p.studentId)), [data.payments, userMap]);

  const structuralErrors: string[] = [];
  if (data.isMultiCollectionReport) {
      structuralErrors.push("Unsupported File Type: This appears to be a multi-collection student export. Please upload a file for a single collection.");
  } else {
      if (!data.hasHeader) structuralErrors.push("Header Missing: Could not find 'Collection Name', 'Amount', and 'Deadline' rows.");
      if (!data.hasBody) structuralErrors.push("Body Missing: Could not find a student data table with the required headers.");
      if (data.hasBody && !data.hasStudentData) structuralErrors.push("Body Empty: The student data table was found, but it contains no students.");
      if (!data.hasFooter) structuralErrors.push("Footer Missing: Could not find the 'Verified by:' row or 'Treasurer's Name' row.");
  }

  const hasStructuralErrors = structuralErrors.length > 0;
  const hasUnrecognizedStudents = unrecognizedPayments.length > 0;

  if (hasStructuralErrors) {
    return (
        <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            aria-modal="true" role="dialog" onClick={onCancel}
        >
            <div 
                className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-red-600 flex items-center">
                        <XCircleIcon className="w-7 h-7 mr-2"/>
                        File Validation Failed
                    </h2>
                </div>

                <div className="mt-4 flex-grow overflow-y-auto pr-2 space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p className="font-semibold text-red-800">We found the following issues:</p>
                        <ul className="list-disc list-inside mt-2 text-sm text-red-700 space-y-1">
                            {structuralErrors.map((error, index) => <li key={index}>{error}</li>)}
                        </ul>
                         <p className="text-xs text-red-600 mt-3">Please correct your XLSX file based on the template and try again.</p>
                    </div>

                     <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Parsed Data</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
                            <div><span className="font-medium text-gray-500">Collection Name:</span> <span className="font-semibold text-gray-900">{data.collectionName || 'Not found'}</span></div>
                            <div><span className="font-medium text-gray-500">Default Amount:</span> <span className="font-semibold text-gray-900">{data.amount ? formatCurrency(data.amount) : 'Not found'}</span></div>
                            <div><span className="font-medium text-gray-500">Deadline:</span> <span className="font-semibold text-gray-900">{data.deadline ? formatDate(data.deadline) : 'Not found'}</span></div>
                            <div><span className="font-medium text-gray-500">Treasurer:</span> <span className="font-semibold text-gray-900">{data.treasurerName || 'Not found'}</span></div>
                            <div className="md:col-span-2"><span className="font-medium text-gray-500">Students Found:</span> <span className="font-semibold text-gray-900">{data.payments.length}</span></div>
                        </div>
                    </div>
                </div>

                 <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
      onClick={onCancel}
    >
      <div 
        className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Confirm Collection Details</h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="mt-4 flex-grow overflow-y-auto pr-2 space-y-4">
            {data.isRemitted && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-800">Note: Remitted Collection Detected</p>
                    <p className="text-sm text-blue-700 mt-1">This file appears to be from a previously remitted collection. A new, un-remitted collection will be created with these details.</p>
                </div>
            )}
            {hasUnrecognizedStudents && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-800">Warning: {unrecognizedPayments.length} unrecognized student(s)</p>
                    <p className="text-sm text-yellow-700 mt-1">The students listed below were not found in the app's database and will be skipped if you proceed.</p>
                     <ul className="text-xs text-yellow-900 mt-2 list-disc list-inside">
                        {unrecognizedPayments.map((p, i) => <li key={i}>{p.name} ({p.studentId})</li>)}
                    </ul>
                </div>
            )}
            
            {/* Collection Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                    <p className="text-sm font-medium text-gray-500">Collection Name</p>
                    <p className="text-md font-semibold text-gray-900">{data.collectionName}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Default Amount</p>
                    <p className="text-md font-semibold text-gray-900">{formatCurrency(data.amount)}</p>
                </div>
                 <div>
                    <p className="text-sm font-medium text-gray-500">Deadline</p>
                    <p className="text-md font-semibold text-gray-900">{formatDate(data.deadline)}</p>
                </div>
                <div className="md:col-span-3">
                    <p className="text-sm font-medium text-gray-500">Treasurer</p>
                    <p className="text-md font-semibold text-gray-900">{data.treasurerName}</p>
                </div>
            </div>

            {/* Payment List */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-700">Valid Payments to Record ({validPayments.length})</h3>
                    <div className="flex items-center text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        <CheckCircleIcon className="w-4 h-4 mr-1.5"/>
                        All Student IDs Validated
                    </div>
                </div>
                 <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {validPayments.map((payment, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-mono">{formatCurrency(payment.amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.date || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.time || 'N/A'}</td>
                                </tr>
                            ))}
                             {validPayments.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-4 text-sm text-gray-500">No valid student payments to record.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200">
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
                Cancel
            </button>
            <button
                type="button"
                onClick={onConfirm}
                disabled={validPayments.length === 0}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
                {hasUnrecognizedStudents ? `Confirm & Skip ${unrecognizedPayments.length}` : 'Confirm & Create'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CollectionPreviewModal;