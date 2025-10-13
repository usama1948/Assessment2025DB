import React, { useState } from 'react';
import type { School } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { SearchIcon } from './icons/SearchIcon';

interface SchoolListProps {
  schools: School[];
  removeSchool: (id: number) => void;
  editSchool: (school: School) => void;
}

const DetailItem: React.FC<{ label: string; value: string | boolean | undefined | null }> = ({ label, value }) => {
    const displayValue = typeof value === 'boolean' ? (value ? 'نعم' : 'لا') : (value || 'غير محدد');
    return (
        <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
            <span className="text-slate-800 font-medium whitespace-nowrap overflow-hidden text-ellipsis">{displayValue}</span>
        </div>
    );
};


export const SchoolList: React.FC<SchoolListProps> = ({ schools, removeSchool, editSchool }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSchools = schools.filter(school =>
    school.schoolNameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (school.schoolNameEn && school.schoolNameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
    school.nationalId.includes(searchTerm) ||
    school.principalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">قائمة المدارس</h2>
        <div className="relative">
            <input
                type="text"
                placeholder="ابحث عن مدرسة (بالاسم، الرقم الوطني، المدير...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                aria-label="ابحث عن مدرسة"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="w-5 h-5 text-slate-400" />
            </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 space-y-4 max-h-[calc(85vh-160px)] overflow-y-auto">
        {schools.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500">لا توجد مدارس لعرضها حالياً.</p>
            <p className="text-slate-400 mt-1">أضف مدرسة جديدة من النموذج للبدء.</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500">لا توجد نتائج مطابقة لبحثك.</p>
          </div>
        ) : (
          filteredSchools.map((school) => (
            <div key={school.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-grow min-w-0">
                  <h3 className="text-lg font-bold text-sky-700 truncate" title={school.schoolNameAr}>{school.schoolNameAr}</h3>
                  <p className="text-sm text-slate-500 truncate" title={school.schoolNameEn}>{school.schoolNameEn || 'لا يوجد اسم إنجليزي'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <button onClick={() => editSchool(school)} className="text-slate-400 hover:text-sky-500 transition-colors" aria-label={`تعديل مدرسة ${school.schoolNameAr}`}>
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => removeSchool(school.id)} className="text-slate-400 hover:text-red-500 transition-colors" aria-label={`حذف مدرسة ${school.schoolNameAr}`}>
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                  <DetailItem label="الرقم الوطني" value={school.nationalId} />
                  <DetailItem label="الرقم الخاص" value={school.schoolId} />
                  <DetailItem label="المنطقة" value={school.region} />
                  <DetailItem label="جنس المدرسة" value={school.schoolGender} />
                  <DetailItem label="اسم المدير" value={school.principalName} />
                  <DetailItem label="ايميل المدير" value={school.principalEmail} />
                  <DetailItem label="هاتف المدير" value={school.principalPhone} />
                  <DetailItem label="نوع المبنى" value={school.buildingType} />
                  <DetailItem label="أدنى صف" value={school.lowestGrade} />
                  <DetailItem label="أعلى صف" value={school.highestGrade} />
                  <DetailItem label="مدرسة مخيم؟" value={school.isCamp} />
                  <DetailItem label="تاريخ الإضافة" value={new Date(school.dateAdded).toLocaleDateString('ar-EG')} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};