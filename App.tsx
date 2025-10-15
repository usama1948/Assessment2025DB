import React, { useState, useEffect } from 'react';
import MainNavigation from './components/MainNavigation';
import SchoolManagementPage from './pages/SchoolManagementPage';
import TestResultsPage from './pages/TestResultsPage';
import ReportsPage from './pages/ReportsPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import { UserIcon } from './components/icons/UserIcon';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import { CogIcon } from './components/icons/CogIcon';


type Page = 'schools' | 'results' | 'reports' | 'users' | 'profile';

const AppContent: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('schools');

  // This effect now correctly sets the default page ONLY when the user logs in.
  useEffect(() => {
    if (user) {
      if (user.role === 'supervisor') {
        setCurrentPage('reports');
      } else if (user.role === 'admin') {
        // For admin and manager, the default is 'schools'
        setCurrentPage('schools');
      } else {
        setCurrentPage('schools');
      }
    }
    // We only want this to run when the `user` object changes (on login/logout).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-right">
                    <h1 className="text-4xl font-bold text-sky-700">نظام إدارة الاختبارات في مدارس وكالة الغوث</h1>
                    <p className="text-slate-500 mt-2">إدارة شاملة لبيانات المدارس ونتائج الاختبارات في قاعدة بيانات مركزية.</p>
                </div>
                {user && (
                    <div className="flex items-center gap-2 bg-white p-3 rounded-lg shadow-md shrink-0">
                        <UserIcon className="w-8 h-8 text-sky-600" />
                        <div className="text-right">
                            <p className="font-bold text-slate-800">{user.username}</p>
                            <p className="text-sm text-slate-500">
                               {user.role === 'admin' && 'مسؤول النظام'}
                               {user.role === 'manager' && 'مدير مدرسة'}
                               {user.role === 'supervisor' && 'مشرف'}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 border-r border-slate-200 pr-2 ml-1">
                            <button onClick={() => setCurrentPage('profile')} className="p-2 text-slate-500 hover:text-sky-600 rounded-full hover:bg-slate-200 transition-colors" title="إعدادات الحساب">
                                <CogIcon className="w-6 h-6" />
                            </button>
                            <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 font-semibold p-2">
                                خروج
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
        
        <MainNavigation currentPage={currentPage} setCurrentPage={setCurrentPage} />

        <main className="mt-8">
            {currentPage === 'schools' && <SchoolManagementPage />}
            {currentPage === 'results' && <TestResultsPage />}
            {currentPage === 'reports' && <ReportsPage />}
            {currentPage === 'users' && user.role === 'admin' && <UserManagementPage />}
            {currentPage === 'profile' && <ProfilePage />}
        </main>

        <footer className="text-center mt-12 text-sm text-slate-400">
            <p>تم التصميم بواسطة أسامة React بو سليم.</p>
        </footer>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;