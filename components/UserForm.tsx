import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { PencilIcon } from './Icons';

interface UserFormProps {
  existingUser: User;
  onSave: (user: User) => void;
  onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ existingUser, onSave, onClose }) => {
  const [id, setId] = useState(existingUser.id);
  const [name, setName] = useState(existingUser.name);
  const [role, setRole] = useState(existingUser.role);
  const [avatarUrl, setAvatarUrl] = useState(existingUser.avatarUrl);

  useEffect(() => {
    setId(existingUser.id);
    setName(existingUser.name);
    setRole(existingUser.role);
    setAvatarUrl(existingUser.avatarUrl);
  }, [existingUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name || !role) return;

    onSave({
      id,
      name,
      role,
      avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${id}`, // Fallback avatar using ID
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Edit Student
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="user-name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Jane Doe"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="user-role" className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <input
            type="text"
            id="user-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g., Member, Officer"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="user-avatar" className="block text-sm font-medium text-gray-700">
            Avatar URL (Optional)
          </label>
          <input
            type="url"
            id="user-avatar"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.png"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="flex space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PencilIcon className="w-5 h-5 mr-2 -ml-1" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;