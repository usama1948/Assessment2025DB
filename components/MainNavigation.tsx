import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';

// FIX: Added 'profile' to the Page type to make it consistent with the Page type in App.tsx.
type Page = 'schools' | 'results' | 'reports' | 'users' | 'profile';

interface MainNavigationProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const MainNavigation: React.FC<MainNavigationProps> = ({ currentPage, setCurrentPage }) => {
  const { user } = useAuth();

  const getButtonClasses = (page: Page) => {
    const baseClasses = 'flex-1 sm:flex-none flex items-center justify-center gap-2 text-lg font-bold py-3 px-6 rounded-lg transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2';
    if (currentPage === page) {
      return `${baseClasses} bg-sky-600 text-white shadow-lg scale-105`;
    }
    return `${baseClasses} bg-white text-slate-600 hover:bg-sky-100 hover:text-sky-700 hover:scale-105`;
  };

  return (
    <nav className="bg-slate-200 p-2 rounded-xl shadow-inner flex flex-col sm:flex-row items-center justify-center gap-2">
      {user?.role === 'admin' && (
        <button onClick={() => setCurrentPage('users')} className={getButtonClasses('users')}>
          <UserGroupIcon className="w-6 h-6" />
          <span>إدارة المستخدمين</span>
        </button>
      )}
      {(user?.role === 'admin' || user?.role === 'manager') && (
        <button onClick={() => setCurrentPage('schools')} className={getButtonClasses('schools')}>
          <BuildingOfficeIcon className="w-6 h-6" />
          <span>{user?.role === 'manager' ? 'بيانات المدرسة' : 'إدارة المدارس'}</span>
        </button>
      )}
      {(user?.role === 'admin' || user?.role === 'manager') && (
        <button onClick={() => setCurrentPage('results')} className={getButtonClasses('results')}>
          <DocumentTextIcon className="w-6 h-6" />
          <span>نتائج الاختبارات</span>
        </button>
      )}
      {(user?.role === 'admin' || user?.role === 'supervisor') && (
        <button onClick={() => setCurrentPage('reports')} className={getButtonClasses('reports')}>
          <ClipboardDocumentListIcon className="w-6 h-6" />
          <span>التقارير</span>
        </button>
      )}
    </nav>
  );
};

export default MainNavigation;