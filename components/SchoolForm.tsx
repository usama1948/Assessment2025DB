import React, { useState, useEffect, useRef } from 'react';
import { School, REGIONS, GENDERS, BUILDING_TYPES } from '../types';

// Make sure XLSX is available in the global scope from the CDN
declare var XLSX: any;

interface SchoolFormProps {
  addSchool: (school: Omit<School, 'id' | 'dateAdded'>) => Promise<boolean>;
  addMultipleSchools: (schools: Omit<School, 'id' | 'dateAdded'>[]) => Promise<boolean>;
  updateSchool: (school: School) => Promise<boolean>;
  editingSchool: School | null;
  cancelEdit: () => void;
  isManager?: boolean;
  isNewManagerSetup?: boolean;
  initialNationalId?: string;
}

const initialFormData: Omit<School, 'id' | 'dateAdded'> = {
  schoolNameAr: '',
  schoolNameEn: '',
  schoolId: '',
  nationalId: '',
  region: REGIONS[0],
  principalName: '',
  principalEmail: '',
  principalPhone: '',
  highestGrade: '',
  lowestGrade: '',
  schoolGender: GENDERS[2],
  buildingType: BUILDING_TYPES[0],
  isCamp: false,
};

export const SchoolForm: React.FC<SchoolFormProps> = ({ addSchool, updateSchool, editingSchool, cancelEdit, addMultipleSchools, isManager = false, isNewManagerSetup = false, initialNationalId }) => {
  const [formData, setFormData] = useState<Omit<School, 'id' | 'dateAdded'> | School>(initialFormData);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editingSchool;
  const isForManager = isManager || isNewManagerSetup;
  
  const formTitle = isNewManagerSetup ? 'إعداد بيانات المدرسة' : isManager ? 'بيانات المدرسة' : (isEditing ? 'تعديل بيانات المدرسة' : 'إضافة مدرسة جديدة');

  useEffect(() => {
    if (isEditing) {
      setFormData(editingSchool);
    } else if (isNewManagerSetup && initialNationalId) {
      setFormData({ ...initialFormData, nationalId: initialNationalId });
    }
     else {
      setFormData(initialFormData);
    }
  }, [editingSchool, isEditing, isNewManagerSetup, initialNationalId]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolNameAr || !formData.nationalId || !formData.principalName) {
      setMessage({ type: 'error', text: 'يرجى ملء الحقول الإلزامية: اسم المدرسة (العربية)، الرقم الوطني، واسم المدير.'});
      return;
    }
    
    setMessage({ type: '', text: '' }); // Clear previous messages
    let success = false;

    if (isEditing) {
      success = await updateSchool(formData as School);
      if (success) {
         setMessage({ type: 'success', text: 'تم تحديث المدرسة بنجاح!' });
      }
    } else {
      success = await addSchool(formData as Omit<School, 'id' | 'dateAdded'>);
      if (success) {
          if (!isNewManagerSetup) {
              setFormData(initialFormData);
          }
          setMessage({ type: 'success', text: 'تمت إضافة المدرسة بنجاح!' });
      }
    }

    if (success) {
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } else {
        setMessage({ type: 'error', text: 'فشلت العملية. يرجى مراجعة البيانات والمحاولة مرة أخرى.'});
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage({ type: '', text: '' });
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          throw new Error("الملف فارغ أو لا يحتوي على بيانات.");
        }
        
        const requiredHeaders = ['schoolNameAr', 'nationalId', 'principalName'];
        const fileHeaders = Object.keys(json[0]);
        if (!requiredHeaders.every(header => fileHeaders.includes(header))) {
          throw new Error(`الملف يجب أن يحتوي على الأعمدة الإلزامية: ${requiredHeaders.join(', ')}.`);
        }

        const newSchools: Omit<School, 'id' | 'dateAdded'>[] = json
          .map((row, index) => {
            // Basic validation
            if (!row.schoolNameAr || !row.nationalId || !row.principalName) {
              console.warn(`Row ${index + 2} is missing required data and will be skipped.`);
              return null;
            }

            return {
              schoolNameAr: row.schoolNameAr?.toString() ?? '',
              schoolNameEn: row.schoolNameEn?.toString() ?? '',
              schoolId: row.schoolId?.toString() ?? '',
              nationalId: row.nationalId?.toString() ?? '',
              region: REGIONS.includes(row.region) ? row.region : REGIONS[0],
              principalName: row.principalName?.toString() ?? '',
              principalEmail: row.principalEmail?.toString() ?? '',
              principalPhone: row.principalPhone?.toString() ?? '',
              highestGrade: row.highestGrade?.toString() ?? '',
              lowestGrade: row.lowestGrade?.toString() ?? '',
              schoolGender: GENDERS.includes(row.schoolGender) ? row.schoolGender : GENDERS[2],
              buildingType: BUILDING_TYPES.includes(row.buildingType) ? row.buildingType : BUILDING_TYPES[0],
              isCamp: typeof row.isCamp === 'boolean' ? row.isCamp : (row.isCamp?.toString().toUpperCase() === 'TRUE'),
            };
          })
          .filter((school): school is Omit<School, 'id' | 'dateAdded'> => school !== null);

        if (newSchools.length > 0) {
          const success = await addMultipleSchools(newSchools);
          if (success) {
            setMessage({ type: 'success', text: `تم استيراد ${newSchools.length} مدرسة بنجاح.` });
          } else {
            throw new Error("فشل استيراد المدارس. تحقق من بيانات الملف أو رسالة الخطأ في أعلى الصفحة.");
          }
        } else {
           throw new Error("لم يتم العثور على بيانات صالحة للاستيراد في الملف.");
        }

      } catch (error: any) {
        console.error(error);
        setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء معالجة الملف.' });
      } finally {
        // Reset file input to allow re-uploading the same file
        if (e.target) e.target.value = '';
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const renderInput = (id: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <input
        id={id}
        name={id}
        value={formData[id as keyof typeof formData] as string}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition disabled:bg-slate-100"
        {...props}
      />
    </div>
  );

  const renderSelect = (id: string, label: string, options: readonly string[]) => (
     <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <select
        id={id}
        name={id}
        value={formData[id as keyof typeof formData] as string}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition bg-white"
      >
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-md sticky top-8">
      <h2 className="text-2xl font-bold mb-4 text-slate-700">{formTitle}</h2>
      
      {message.text && (
        <p className={`${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} p-3 rounded-lg mb-4 text-sm`}>
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        
        <h3 className="font-bold text-slate-500 border-b pb-1">معلومات أساسية</h3>
        {renderInput('schoolNameAr', 'اسم المدرسة (العربية)*', { placeholder: 'مثال: مدرسة النهضة الثانوية' })}
        {renderInput('schoolNameEn', 'اسم المدرسة (الإنجليزية)', { placeholder: 'e.g., Al-Nahda High School' })}
        <div className="grid grid-cols-2 gap-4">
            {renderInput('schoolId', 'الرقم الخاص للمدرسة', { placeholder: '12345' })}
            {renderInput('nationalId', 'الرقم الوطني*', { placeholder: '200100...', disabled: isNewManagerSetup })}
        </div>
        {renderSelect('region', 'المنطقة', REGIONS)}

        <h3 className="font-bold text-slate-500 border-b pb-1 pt-4">معلومات المدير</h3>
        {renderInput('principalName', 'اسم المدير*', { placeholder: 'مثال: عبدالله سالم' })}
        {renderInput('principalEmail', 'ايميل المدير', { type: 'email', placeholder: 'manager@example.com' })}
        {renderInput('principalPhone', 'هاتف المدير', { type: 'tel', placeholder: '05xxxxxxxx' })}

        <h3 className="font-bold text-slate-500 border-b pb-1 pt-4">تفاصيل المدرسة</h3>
        <div className="grid grid-cols-2 gap-4">
          {renderInput('lowestGrade', 'أدنى صف', { placeholder: 'الأول' })}
          {renderInput('highestGrade', 'أعلى صف', { placeholder: 'الثاني عشر' })}
        </div>
        {renderSelect('schoolGender', 'جنس المدرسة', GENDERS)}
        {renderSelect('buildingType', 'نوع المبنى', BUILDING_TYPES)}

        <div className="flex items-center gap-2 pt-2">
            <input
                type="checkbox"
                id="isCamp"
                name="isCamp"
                checked={!!formData.isCamp}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="isCamp" className="text-sm font-medium text-slate-600">مدرسة مخيم؟</label>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <button
            type="submit"
            className="flex-grow bg-sky-600 text-white font-bold py-3 px-4 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition duration-300 ease-in-out transform hover:scale-105"
          >
            {isNewManagerSetup ? 'حفظ ومتابعة' : (isEditing ? 'حفظ التعديلات' : 'إضافة المدرسة')}
          </button>
          {isEditing && !isForManager && (
            <button
              type="button"
              onClick={() => { cancelEdit(); setMessage({ type: '', text: '' }); }}
              className="flex-grow bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition"
            >
              إلغاء
            </button>
          )}
        </div>

         { !isEditing && !isForManager && (
           <div className="border-t border-slate-200 mt-6 pt-4 text-center">
              <p className="text-sm text-slate-500 mb-2">أو</p>
               <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                style={{ display: 'none' }} 
              />
              <button
                type="button"
                onClick={handleImportClick}
                className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition"
              >
                تحميل البيانات من ملف Excel
              </button>
          </div>
         )}
      </form>
    </div>
  );
};