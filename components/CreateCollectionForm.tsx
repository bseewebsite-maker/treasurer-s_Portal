import React, { useState, useEffect } from 'react';
import type { Collection } from '../types';
import { PlusIcon, PencilIcon, CollectionIcon, CalendarDaysIcon } from './Icons';

interface CreateCollectionFormProps {
  onSaveCollection: (collection: Omit<Collection, 'id'>, id?: string) => void;
  onClose: () => void;
  initialData?: Partial<Omit<Collection, 'id'>> | null;
  collectionToEdit?: Collection | null;
}

type CollectionType = 'regular' | 'ulikdanay';

const CreateCollectionForm: React.FC<CreateCollectionFormProps> = ({ onSaveCollection, onClose, initialData, collectionToEdit }) => {
  const [step, setStep] = useState(1);
  const [collectionType, setCollectionType] = useState<CollectionType | null>(null);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [ulikdanayMonth, setUlikdanayMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  
  const dataToEdit = collectionToEdit || initialData;
  const isEditing = !!collectionToEdit;

  useEffect(() => {
    if (dataToEdit) {
      const isUlik = dataToEdit.name?.toLowerCase().includes('ulikdanay');
      setCollectionType(isUlik ? 'ulikdanay' : 'regular');
      setStep(2); // Skip to details step when editing or have initial data

      setName(dataToEdit.name || '');
      setAmount(dataToEdit.amountPerUser?.toString() || '');
      
      const deadlineDate = dataToEdit.deadline ? new Date(dataToEdit.deadline) : null;
      if (deadlineDate) {
        deadlineDate.setMinutes(deadlineDate.getMinutes() + deadlineDate.getTimezoneOffset());
        setDeadline(deadlineDate.toISOString().split('T')[0]);
      } else {
        setDeadline('');
      }

      if(isUlik) {
          const foundMonth = months.find(m => dataToEdit.name?.toLowerCase().includes(m.toLowerCase()));
          if (foundMonth) {
              setUlikdanayMonth(foundMonth);
          }
      }
    }
  }, [dataToEdit]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleSelectType = (type: CollectionType) => {
    setCollectionType(type);
    if (type === 'ulikdanay') {
        setAmount('5');
    } else {
        setAmount(''); // Reset amount for regular collections
    }
    setStep(2);
  };
  
  const handleBack = () => {
    if (isEditing) {
        onClose(); // If editing, back should just close
    } else {
        setStep(1);
        setCollectionType(null);
    }
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const setDeadlineTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeadline(formatDateForInput(tomorrow));
  };

  const setDeadlineThisWeek = () => {
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    setDeadline(formatDateForInput(endOfWeek));
  };

  const setDeadlineThisMonth = () => {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setDeadline(formatDateForInput(endOfMonth));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const collectionName = collectionType === 'ulikdanay' ? `Ulikdanay Fund - ${ulikdanayMonth}` : name.trim();
    if (!collectionName || !deadline) return;

    onSaveCollection({
      name: collectionName,
      amountPerUser: amount ? parseFloat(amount) : 0,
      deadline: deadline,
    }, collectionToEdit?.id);
  };

  const renderStep1 = () => (
    <div>
        <h2 className="text-xl font-bold text-stone-800 text-center">Choose Collection Type</h2>
        <p className="text-center text-sm text-stone-600 mb-6">Select what kind of collection you want to create.</p>
        <div className="space-y-4">
            <button
                onClick={() => handleSelectType('regular')}
                className="w-full text-left p-4 border border-stone-200 rounded-2xl flex items-center hover:bg-blue-50 hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 group"
            >
                <div className="bg-blue-100 p-2 rounded-full mr-4 group-hover:bg-blue-200 transition-colors">
                    <CollectionIcon className="h-8 w-8 text-blue-600"/>
                </div>
                <div>
                    <h3 className="font-semibold text-stone-800">Regular Collection</h3>
                    <p className="text-sm text-stone-500">For standard dues or one-time events.</p>
                </div>
            </button>
            <button
                onClick={() => handleSelectType('ulikdanay')}
                className="w-full text-left p-4 border border-stone-200 rounded-2xl flex items-center hover:bg-cyan-50 hover:border-cyan-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300 group"
            >
                <div className="bg-cyan-100 p-2 rounded-full mr-4 group-hover:bg-cyan-200 transition-colors">
                    <CalendarDaysIcon className="h-8 w-8 text-cyan-600"/>
                </div>
                <div>
                    <h3 className="font-semibold text-stone-800">Ulikdanay Fund</h3>
                    <p className="text-sm text-stone-500">For the monthly class fund (defaults to ₱5).</p>
                </div>
            </button>
        </div>
    </div>
  );

  const renderStep2 = () => (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in" style={{animationDuration: '300ms'}}>
      {collectionType === 'ulikdanay' ? (
         <div>
          <label htmlFor="ulikdanay-month" className="block text-sm font-medium text-stone-700">
              Month
          </label>
          <select
              id="ulikdanay-month"
              value={ulikdanayMonth}
              onChange={(e) => setUlikdanayMonth(e.target.value)}
              className="mt-1 block w-full px-3 py-2.5 border border-stone-200 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
              aria-required="true"
          >
              {months.map(month => <option key={month} value={month}>{month}</option>)}
          </select>
         </div>
      ) : (
          <div>
          <label htmlFor="collection-name" className="block text-sm font-medium text-stone-700">
              Collection Name
          </label>
          <input
              type="text"
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Spring 2024 Dues"
              className="mt-1 block w-full px-3 py-2.5 border border-stone-200 bg-white rounded-xl shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
              required={collectionType === 'regular'}
              aria-required={collectionType === 'regular'}
              autoFocus
              autoComplete="one-time-code"
          />
          </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        <div>
          <label htmlFor="amount-per-user" className="block text-sm font-medium text-stone-700">
            Amount (₱)
          </label>
          <input
            type="number"
            id="amount-per-user"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 50"
            min="0"
            step="0.01"
            className="mt-1 block w-full px-3 py-2.5 border border-stone-200 bg-white rounded-xl shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-stone-700">
                Deadline
            </label>
            <input
                type="date"
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1 block w-full px-3 py-2.5 border border-stone-200 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                required
                aria-required="true"
            />
             <div className="flex space-x-2 mt-2">
                <button type="button" onClick={setDeadlineTomorrow} aria-label="Set deadline to tomorrow" className="flex-1 text-xs text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100 rounded-lg py-1.5 px-2 transition-colors border border-blue-100">Tomorrow</button>
                <button type="button" onClick={setDeadlineThisWeek} aria-label="Set deadline to the end of this week" className="flex-1 text-xs text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100 rounded-lg py-1.5 px-2 transition-colors border border-blue-100">This Week</button>
                <button type="button" onClick={setDeadlineThisMonth} aria-label="Set deadline to the end of this month" className="flex-1 text-xs text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100 rounded-lg py-1.5 px-2 transition-colors border border-blue-100">This Month</button>
            </div>
        </div>
      </div>
      
      <div className="flex space-x-3 pt-4">
          <button
              type="button"
              onClick={handleBack}
              className="w-full flex justify-center items-center px-4 py-2.5 border border-stone-300 text-sm font-medium rounded-xl shadow-sm text-stone-700 bg-white hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
          >
              {isEditing ? 'Cancel' : 'Back'}
          </button>
          <button
          type="submit"
          className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
          >
          {isEditing ? <PencilIcon className="w-5 h-5 mr-2 -ml-1" /> : <PlusIcon className="w-5 h-5 mr-2 -ml-1" />}
          {isEditing ? 'Save Changes' : 'Create Collection'}
          </button>
      </div>
    </form>
  );

  return (
    <div className="bg-white p-8 shadow-2xl w-full max-w-3xl border sm:border-stone-200 sm:rounded-3xl rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <div className="mb-6 text-center sm:text-left">
            {step === 2 && !isEditing && (
                <div className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-1">Step 2 of 2</div>
            )}
             <h2 className="text-2xl font-bold text-stone-800">{isEditing ? 'Edit Collection' : (step === 1 ? 'New Collection' : 'Collection Details')}</h2>
        </div>
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
    </div>
  );
};

export default CreateCollectionForm;