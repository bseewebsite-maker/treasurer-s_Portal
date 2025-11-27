// Fix: Implementing the AiCreateCollectionForm component.
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { User, Collection, AiGeneratedCollection } from '../types';
import { AiIcon, UploadIcon, DownloadIcon } from './Icons';
import ValidationChecklistItem from './ValidationChecklistItem';

declare const XLSX: any;

interface AiCreateCollectionFormProps {
  onSuggest: (collection: Omit<Collection, 'id'>) => void; // This might be deprecated with the file-first approach but kept for type safety.
  onPreview: (data: AiGeneratedCollection) => void;
  onClose: () => void;
  users: User[];
}

type ValidationStatus = 'pending' | 'success' | 'error';
interface ChecklistItem {
    text: string;
    status: ValidationStatus;
}

const initialChecklist: ChecklistItem[] = [
    { text: 'Checking for valid header...', status: 'pending' },
    { text: 'Scanning for student data...', status: 'pending' },
    { text: 'Verifying treasurer footer...', status: 'pending' },
    { text: 'Cross-referencing student IDs...', status: 'pending' },
];

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

const AiCreateCollectionForm: React.FC<AiCreateCollectionFormProps> = ({
  onPreview,
  onClose,
  users,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'upload' | 'validating'>('upload');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.name.endsWith('.xlsx'))) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please upload a valid .xlsx file.');
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };


  const updateChecklistStatus = (index: number, status: ValidationStatus, delay: number): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            setChecklist(prev => prev.map((item, i) => i === index ? { ...item, status } : item));
            resolve();
        }, delay);
    });
  };

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    setError(null);
    setView('upload');
    setChecklist(initialChecklist);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleFileSubmit = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setView('validating');
    setIsProcessing(true);
    setError(null);
    setChecklist(initialChecklist);

    const fileToCsv = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            resolve(csv);
          } catch (err: any) {
            reject(new Error("Could not parse the XLSX file. Please ensure it's valid."));
          }
        };
        reader.onerror = (error) => reject(new Error("Failed to read the file."));
        reader.readAsBinaryString(file);
      });
    };

    try {
      const csvContent = await fileToCsv(file);
      
      if (!process.env.API_KEY) {
        throw new Error("Gemini API Key is not configured. Please ensure the API_KEY environment variable is set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Parse the following XLSX file content (provided as CSV): \n\n${csvContent}`,
        config: {
          systemInstruction: getFileParseSystemInstruction(users),
          responseMimeType: 'application/json',
          responseSchema: getFileParseSchema(),
        },
      });

      const jsonString = response.text.trim();
      const result = JSON.parse(jsonString) as AiGeneratedCollection;

      const userMap = new Map(users.map(u => [u.id, u]));
      const invalidStudentIds = result.payments.filter(p => !userMap.has(p.studentId));

      await updateChecklistStatus(0, result.hasHeader ? 'success' : 'error', 300);
      await updateChecklistStatus(1, result.hasBody && result.hasStudentData ? 'success' : 'error', 300);
      await updateChecklistStatus(2, result.hasFooter ? 'success' : 'error', 300);
      await updateChecklistStatus(3, invalidStudentIds.length === 0 ? 'success' : 'error', 300);
      
      // Proceed to preview after a short delay for the user to see the checklist.
      // The preview modal will now handle displaying structural errors or student warnings.
      setTimeout(() => {
        onPreview(result);
      }, 1500);

    } catch (err: unknown) {
        console.error("AI processing failed:", err);
        let message: string;

        if (err instanceof Error) {
            if (err.message.includes("API key not valid")) {
                message = "AI processing failed: The API Key is not valid. Please ensure your application is configured correctly for your build environment (e.g., Capacitor).";
            } else {
                message = `An unexpected error occurred: ${err.message}. Please check the console for details.`;
            }
        } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
            message = `An error occurred during processing: ${err.message}`;
        } else {
            try {
                message = `An unknown error occurred: ${JSON.stringify(err)}`;
            } catch {
                message = 'An unknown error occurred while processing your file.';
            }
        }
        
        setError(message);
        setIsProcessing(false);
        // On a catastrophic failure, mark all checklist items as errors for better feedback
        setChecklist(prev => prev.map(item => ({ ...item, status: 'error' })));
    }
  };

  const handleDownloadTemplate = () => {
      const header = [
        ['Collection Name:', 'Summer Field Trip'],
        ['Amount:', 500],
        ['Deadline:', '2024-08-15'],
      ];
  
      const bodyHeader = ['Student ID', 'Name', 'Amount Paid', 'Time', 'Date'];
      
      const body = users.slice(0, 3).map((user, i) => [
          user.id,
          user.name,
          i === 0 ? 500 : (i === 1 ? 250 : 0),
          i === 0 ? '2:15 PM' : (i === 1 ? '10:00 AM' : ''),
          i === 0 ? '2024-07-20' : (i === 1 ? '2024-07-21' : '')
      ]);

      const footer = [
        ['Verified by:', 'Your Name Here']
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
      worksheet['!cols'] = [ { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, ];
  
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'CollectionTemplate');
      XLSX.writeFile(workbook, 'collection_template.xlsx');
  };

  return (
    <div className="bg-white p-6 shadow-2xl w-full max-w-2xl border-t border-gray-200 sm:border sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <AiIcon className="h-7 w-7 mr-2" />
                Create Collection from File
            </h2>
            <p className="text-sm text-gray-600">
                Upload an XLSX file and let AI parse the details.
            </p>
        </div>
        <button onClick={handleDownloadTemplate} className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors group whitespace-nowrap">
            <DownloadIcon className="h-4 w-4 mr-1"/>
            Download Template
        </button>
      </div>

      {view === 'upload' && (
        <div className="mt-6">
          <label
            htmlFor="file-upload"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex justify-center w-full h-48 px-6 pt-5 pb-6 border-2 ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 border-dashed'} rounded-md cursor-pointer transition-colors`}
          >
            <div className="space-y-1 text-center self-center">
              <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <p className="pl-1">
                  {file ? (
                    <span className="font-semibold text-blue-600">{file.name}</span>
                  ) : (
                    <>
                      <span className="font-semibold text-blue-600">Upload a file</span> or drag and drop
                    </>
                  )}
                </p>
                <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => handleFileChange(e.target.files?.[0] || null)}/>
              </div>
              <p className="text-xs text-gray-500">XLSX files only</p>
            </div>
          </label>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          
          <div className="flex space-x-2 pt-6">
            <button type="button" onClick={onClose} className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
            <button type="button" onClick={handleFileSubmit} disabled={!file || isProcessing} className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400">
              {isProcessing ? 'Processing...' : 'Process with AI'}
            </button>
          </div>
        </div>
      )}

      {view === 'validating' && (
        <div className="mt-6 space-y-3 animate-fade-in">
          <h3 className="text-md font-semibold text-center text-gray-800">Validating your file...</h3>
          {checklist.map((item, index) => (
            <ValidationChecklistItem key={index} status={item.status}>
              {item.text}
            </ValidationChecklistItem>
          ))}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <p className="font-bold">An Error Occurred</p>
                <p>{error}</p>
            </div>
          )}
          {(isProcessing === false && error) && (
             <div className="flex justify-end pt-4">
                 <button type="button" onClick={resetState} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                    Try Again
                </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiCreateCollectionForm;