import React, { useState, useEffect } from 'react';
import { ManagedUser } from '../types';

interface UserFormProps {
  addUser: (user: Omit<ManagedUser, 'id' | 'dateAdded'>) => Promise<boolean>;
  updateUser: (user: ManagedUser) => Promise<boolean>;
  editingUser: ManagedUser | null;
  cancelEdit: () => void;
  apiError: string | null;
}

const initialFormData: Omit<ManagedUser, 'id' | 'dateAdded'> = {
  username: '',
  role: 'supervisor',
  password: '',
};

export const UserForm: React.FC<UserFormProps> = ({ addUser, updateUser, editingUser, cancelEdit, apiError }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const isEditing = !!editingUser;

  useEffect(() => {
    if (isEditing) {
      setFormData({ ...editingUser, password: '' }); // Don't show old password
    } else {
      setFormData(initialFormData);
    }
  }, [editingUser, isEditing]);
  
  // Clear local message when a new API error comes in
  useEffect(() => {
      setMessage({ type: '', text: '' });
  }, [apiError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!formData.username || (!isEditing && !formData.password)) {
      setMessage({ type: 'error', text: 'يرجى ملء اسم المستخدم وكلمة المرور.' });
      return;
    }
    
    if (formData.role === 'manager' && !/^\d+$/.test(formData.username)) {
      setMessage({ type: 'error', text: 'عند اختيار دور "مدير مدرسة"، يجب أن يكون اسم المستخدم هو الرقم الوطني للمدرسة (أرقام فقط).' });
      return;
    }

    setLoading(true);
    let success = false;

    if (isEditing) {
        const userDataToUpdate: ManagedUser = { ...editingUser, role: formData.role, password: formData.password };
        // The API handles empty password (doesn't update if empty)
        success = await updateUser(userDataToUpdate);
        if(success) setMessage({ type: 'success', text: 'تم تحديث المستخدم بنجاح!' });
    } else {
      success = await addUser(formData);
      if(success) {
        setFormData(initialFormData);
        setMessage({ type: 'success', text: 'تمت إضافة المستخدم بنجاح!' });
      }
    }

    setLoading(false);
    if(success) {
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const finalMessage = message.text ? message : apiError ? { type: 'error', text: apiError } : null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md sticky top-8">
      <h2 className="text-2xl font-bold mb-4 text-slate-700">{isEditing ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h2>
      
      {finalMessage && (
        <p className={`${finalMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} p-3 rounded-lg mb-4 text-sm`}>
          {finalMessage.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-600 mb-1">اسم المستخدم*</label>
          <input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition disabled:bg-slate-100"
            placeholder={formData.role === 'manager' ? 'الرقم الوطني للمدرسة' : 'e.g., supervisor2'}
            disabled={isEditing}
          />
        </div>

        <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-600 mb-1">الدور*</label>
            <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white disabled:bg-slate-100"
                disabled={isEditing}
            >
                <option value="supervisor">مشرف</option>
                <option value="manager">مدير مدرسة</option>
                <option value="admin">مسؤول النظام</option>
            </select>
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1">
            {isEditing ? 'كلمة المرور الجديدة' : 'كلمة المرور*'}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            placeholder={isEditing ? 'اتركه فارغاً لعدم التغيير' : '••••••••'}
          />
        </div>
        
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-grow bg-sky-600 text-white font-bold py-3 px-4 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition disabled:bg-slate-400"
          >
            {loading ? 'جاري الحفظ...' : (isEditing ? 'حفظ التعديلات' : 'إضافة المستخدم')}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => { cancelEdit(); setMessage({ type: '', text: '' }); }}
              className="flex-grow bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>
    </div>
  );
};