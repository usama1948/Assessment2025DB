import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { SchoolForm } from '../components/SchoolForm';
import { SchoolList } from '../components/SchoolList';
import type { School } from '../types';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/apiService';

const SchoolManagementPage: React.FC = () => {
  const { user, setUser } = useAuth();
  
  const [schoolsFromDB, setSchoolsFromDB] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  
  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: School[] = await api.getAll<School>('schools');
      setSchoolsFromDB(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== 'manager' || (user?.role === 'manager' && !user.isNew)) {
      fetchSchools();
    } else {
      setLoading(false);
    }
  }, [user, fetchSchools]);


  const schools = useMemo(() => {
    if (user?.role === 'manager') {
      return schoolsFromDB.filter(s => s.nationalId === user.schoolId);
    }
    return schoolsFromDB;
  }, [schoolsFromDB, user]);

  useEffect(() => {
    if(user?.role === 'manager' && !user.isNew && schools.length > 0) {
      setEditingSchool(schools[0]);
    }
  }, [user, schools]);
  
  const handleAddSchoolForAdmin = async (newSchoolData: Omit<School, 'id' | 'dateAdded'>): Promise<boolean> => {
    setError(null);
    try {
      const addedSchool = await api.add<School, Omit<School, 'id' | 'dateAdded'>>('schools', newSchoolData);
      setSchoolsFromDB(prevSchools => [addedSchool, ...prevSchools]);
      return true;
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع عند إضافة المدرسة.');
      console.error(err);
      return false;
    }
  };
  
  const handleAddSchoolForNewManager = async (newSchoolData: Omit<School, 'id' | 'dateAdded'>): Promise<boolean> => {
    setError(null);
    try {
      const addedSchool = await api.add<School, Omit<School, 'id' | 'dateAdded'>>('schools', newSchoolData);
      setSchoolsFromDB([addedSchool]);
  
      if (user) {
        setUser({ ...user, isNew: false, username: addedSchool.schoolNameAr });
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع عند إضافة المدرسة.');
      console.error(err);
      return false;
    }
  };

  const handleAddMultipleSchools = async (newSchoolsData: Omit<School, 'id' | 'dateAdded'>[]): Promise<boolean> => {
    setError(null);
    try {
      await api.addMultiple('schools', newSchoolsData);
      await fetchSchools(); // Refresh the list after successful import
      return true;
    } catch (err: any) {
      setError(err.message || 'فشل استيراد المدارس. تحقق من بيانات الملف.');
      console.error(err);
      return false;
    }
  };

  const handleRemoveSchool = async (id: number) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه المدرسة؟')) {
      setError(null);
      try {
        await api.remove('schools', id);
        setSchoolsFromDB(prevSchools => prevSchools.filter(school => school.id !== id));
      } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع عند الحذف.');
        console.error(err);
      }
    }
  };
  
  const handleUpdateSchool = async (updatedSchoolData: School): Promise<boolean> => {
     setError(null);
    try {
        const updatedSchool = await api.update<School>('schools', updatedSchoolData.id, updatedSchoolData);
        setSchoolsFromDB(prevSchools => 
            prevSchools.map(school => 
                school.id === updatedSchool.id ? updatedSchool : school
            )
        );
        handleCancelEdit();
        return true;
    } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع عند التحديث.');
        console.error(err);
        return false;
    }
  };


  const handleEditSchool = (school: School) => {
    if (user?.role === 'manager' && school.nationalId !== user.schoolId) return;
    setEditingSchool(school);
  };

  const handleCancelEdit = () => {
    setEditingSchool(null);
  };

  const isManager = user?.role === 'manager';
  const isNewManager = isManager && user.isNew;

  if (isManager) {
    if (isNewManager) {
      return (
        <div className="max-w-3xl mx-auto">
          <div className="bg-sky-100 border-l-4 border-sky-500 text-sky-800 p-4 mb-6 rounded-md shadow" role="alert">
            <p className="font-bold text-lg">مرحباً بك في نظام إدارة المدارس!</p>
            <p className="mt-1">بما أن هذه هي المرة الأولى التي تسجل فيها الدخول، يرجى إكمال بيانات مدرستك للمتابعة.</p>
          </div>
          <SchoolForm
            addSchool={handleAddSchoolForNewManager}
            addMultipleSchools={() => Promise.resolve(false)}
            updateSchool={() => Promise.resolve(false)}
            editingSchool={null}
            cancelEdit={() => {}}
            isNewManagerSetup={true}
            initialNationalId={user.schoolId}
          />
        </div>
      );
    }

    return (
       <div className="max-w-3xl mx-auto">
        {editingSchool ? (
          <SchoolForm 
            addSchool={() => Promise.resolve(false)}
            addMultipleSchools={() => Promise.resolve(false)}
            updateSchool={handleUpdateSchool}
            editingSchool={editingSchool}
            cancelEdit={() => {}}
            isManager={true}
          />
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <p className="text-slate-500">جارِ تحميل بيانات المدرسة...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <SchoolForm 
          addSchool={handleAddSchoolForAdmin}
          addMultipleSchools={handleAddMultipleSchools}
          updateSchool={handleUpdateSchool}
          editingSchool={editingSchool}
          cancelEdit={handleCancelEdit}
        />
      </div>
      <div className="lg:col-span-2">
         {loading && (
            <div className="text-center p-10 bg-white rounded-lg shadow-md flex items-center justify-center h-full">
                <p className="text-slate-500 text-lg">جاري تحميل بيانات المدارس من الخادم...</p>
            </div>
         )}
         {error && (
            <div className="text-center p-10 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-md flex items-center justify-center h-full">
                <div>
                    <p className="font-bold">حدث خطأ</p>
                    <p>{error}</p>
                </div>
            </div>
         )}
        {!loading && !error && (
            <SchoolList 
              schools={schools} 
              removeSchool={handleRemoveSchool}
              editSchool={handleEditSchool} 
            />
        )}
      </div>
    </div>
  );
};

export default SchoolManagementPage;