import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/apiService';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'كلمة المرور الجديدة غير متطابقة.' });
            return;
        }
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل.' });
            return;
        }
        if (!user) {
            setMessage({ type: 'error', text: 'المستخدم غير مسجل.' });
            return;
        }

        setLoading(true);
        try {
            await api.changePassword({
                userId: user.id,
                currentPassword,
                newPassword,
            });

            setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء تحديث كلمة المرور.' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-md">
                <h2 className="text-3xl font-bold text-slate-800 mb-6">إعدادات الحساب</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-1">
                            كلمة المرور الحالية*
                        </label>
                        <input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
                            كلمة المرور الجديدة*
                        </label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                            تأكيد كلمة المرور الجديدة*
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    
                    {message.text && (
                        <p className={`${message.type === 'error' ? 'text-red-600' : 'text-green-600'} text-sm text-center`}>
                            {message.text}
                        </p>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-400 transition"
                        >
                            {loading ? 'جارِ الحفظ...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;