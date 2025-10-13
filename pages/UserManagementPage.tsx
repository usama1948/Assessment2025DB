import React, { useState, useMemo } from 'react';
import { UserForm } from '../components/UserForm';
import { UserList } from '../components/UserList';
import type { ManagedUser } from '../types';
import { useApiData } from '../hooks/useApiData';

const UserManagementPage: React.FC = () => {
  const { 
    data: users, 
    addItem,
    updateItem, 
    removeItem,
    loading,
    error,
  } = useApiData<ManagedUser>('managedUsers');
  
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const sortedUsers = useMemo(() => {
    // The API already returns sorted by id desc, which is effectively by date desc
    return users;
  }, [users]);

  const handleAddUser = async (newUserData: Omit<ManagedUser, 'id' | 'dateAdded'>): Promise<boolean> => {
    const success = await addItem(newUserData);
    if (success) {
      setEditingUser(null);
    }
    return success;
  };

  const handleRemoveUser = async (id: number) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المستخدم؟')) {
        await removeItem(id);
    }
  };

  const handleEditUser = (user: ManagedUser) => {
    setEditingUser(user);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleUpdateUser = async (updatedUserData: ManagedUser): Promise<boolean> => {
    const success = await updateItem(updatedUserData);
    if (success) {
        setEditingUser(null);
    }
    return success;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <UserForm 
          addUser={handleAddUser}
          updateUser={handleUpdateUser}
          editingUser={editingUser}
          cancelEdit={handleCancelEdit}
          apiError={error}
        />
      </div>
      <div className="lg:col-span-2">
        {loading && (
            <div className="text-center p-10 bg-white rounded-lg shadow-md flex items-center justify-center h-full">
                <p className="text-slate-500 text-lg">جاري تحميل بيانات المستخدمين...</p>
            </div>
         )}
         {error && !editingUser && (
            <div className="text-center p-10 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-md">
                <p className="font-bold">حدث خطأ</p>
                <p>{error}</p>
            </div>
         )}
        {!loading && (
            <UserList 
              users={sortedUsers} 
              removeUser={handleRemoveUser}
              editUser={handleEditUser} 
            />
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;