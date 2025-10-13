import React, { useState, useMemo } from 'react';
import type { ManagedUser } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { SearchIcon } from './icons/SearchIcon';

interface UserListProps {
  users: ManagedUser[];
  removeUser: (id: number) => void;
  editUser: (user: ManagedUser) => void;
}

const roleMap = {
  manager: 'مدير مدرسة',
  supervisor: 'مشرف',
  admin: 'مسؤول النظام',
};

export const UserList: React.FC<UserListProps> = ({ users, removeUser, editUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useAuth();

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    roleMap[user.role].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminUsersCount = useMemo(() => users.filter(u => u.role === 'admin').length, [users]);

  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">قائمة المستخدمين</h2>
        <div className="relative">
            <input
                type="text"
                placeholder="ابحث عن مستخدم (بالاسم أو الدور...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                aria-label="ابحث عن مستخدم"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="w-5 h-5 text-slate-400" />
            </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 space-y-3">
         <div className="bg-sky-50 border-l-4 border-sky-400 text-sky-800 p-3 rounded-md text-sm mb-4">
             <p className="font-bold">ملاحظة أمنية:</p>
             <p>لا يمكنك تعديل أو حذف حسابك الخاص من هذه القائمة. لتغيير كلمة المرور، يرجى استخدام صفحة "إعدادات الحساب" من الشريط العلوي.</p>
         </div>
        <div className="max-h-[calc(85vh-230px)] overflow-y-auto pr-2">
            {users.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500">لا يوجد مستخدمون لعرضهم حالياً.</p>
                <p className="text-slate-400 mt-1">أضف مستخدماً جديداً من النموذج للبدء.</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500">لا توجد نتائج مطابقة لبحثك.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {filteredUsers.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  const isLastAdmin = user.role === 'admin' && adminUsersCount <= 1;
                  const canBeDeleted = !isSelf && !isLastAdmin;

                  return (
                    <li key={user.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-md font-bold text-slate-800">{user.username}</p>
                        <p className="text-sm text-slate-500">{roleMap[user.role]}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => editUser(user)} 
                          className="text-slate-400 hover:text-sky-500 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed" 
                          aria-label={`تعديل المستخدم ${user.username}`}
                          disabled={isSelf}
                          title={isSelf ? 'لا يمكن تعديل حسابك من هنا' : `تعديل المستخدم ${user.username}`}
                        >
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => removeUser(user.id)} 
                          className="text-slate-400 hover:text-red-500 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed" 
                          aria-label={`حذف المستخدم ${user.username}`}
                          disabled={!canBeDeleted}
                          title={isSelf ? 'لا يمكن حذف حسابك الخاص' : isLastAdmin ? 'لا يمكن حذف آخر مسؤول في النظام' : `حذف المستخدم ${user.username}`}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
        </div>
      </div>
    </div>
  );
};