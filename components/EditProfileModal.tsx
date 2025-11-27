import React, { useState, useRef } from 'react';
import type { TreasurerProfile } from '../types';
import { PencilIcon, CameraIcon } from './Icons';

interface EditProfileModalProps {
  profile: TreasurerProfile;
  onSave: (profile: TreasurerProfile) => void;
  onClose: () => void;
}

const CLOUDINARY_CLOUD_NAME = 'dichfnv5d';
const CLOUDINARY_UPLOAD_PRESET = 'bseeportal_uploads';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onSave, onClose }) => {
  const [name, setName] = useState(profile.name);
  const [studentId, setStudentId] = useState(profile.studentId);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(profile.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || 'Image upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUploading(true);
    
    try {
      let newAvatarUrl = profile.avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadToCloudinary(avatarFile);
      }
      
      onSave({
        name: name.trim(),
        studentId: studentId.trim(),
        avatarUrl: newAvatarUrl,
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <div className="relative group">
                <img src={avatarPreview} alt="Profile" className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-md"/>
                <button 
                    type="button" 
                    onClick={handleAvatarClick}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Change profile picture"
                >
                    <CameraIcon className="h-8 w-8 text-white"/>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif"
                    className="hidden"
                />
            </div>
          </div>

          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="profile-student-id" className="block text-sm font-medium text-gray-700">Student ID</label>
            <input
              type="text"
              id="profile-student-id"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-400 disabled:cursor-wait"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <PencilIcon className="w-5 h-5 mr-2 -ml-1" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;