import { useState, useEffect, useRef } from 'react';
import type { TestResult, School } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { SearchIcon } from './icons/SearchIcon';

declare var XLSX: any;

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select';
    placeholder?: string;
    options?: readonly string[];
}

// FIX: Make ListColumn generic to correctly handle accessors for different TestResult types.
interface ListColumn<T extends TestResult> {
    header: string;
    accessor: keyof T;
}

interface TestManagerProps<T extends TestResult> {
    title: string;
    data: T[];
    config: {
        formFields: FormField[];
        // FIX: Use the generic ListColumn<T> type.
        listColumns: ListColumn<T>[];
        requiredFields: string[];
        excelHeaders: string[];
    };
    onAdd: (item: Omit<T, 'id' | 'dateAdded'>) => Promise<boolean>;
    onAddMultiple: (items: Omit<T, 'id' | 'dateAdded'>[]) => Promise<boolean>;
    onUpdate: (item: T) => Promise<boolean>;
    onDelete: (id: number) => Promise<boolean>;
    schools?: School[];
    readOnly?: boolean;
    apiError?: string | null;
}

export const TestManager = <T extends TestResult>({ title, data, config, onAdd, onAddMultiple, onUpdate, onDelete, schools, readOnly = false, apiError }: TestManagerProps<T>) => {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [formData, setFormData] = useState<Partial<T>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    const isEditing = !!editingItem;
    
    useEffect(() => {
        if (isEditing) {
            setFormData(editingItem);
            setIsFormVisible(true);
        } else {
            const initialData = config.formFields.reduce((acc, field) => {
                let initialValue: any = '';
                 if (field.type === 'select') {
                    initialValue = field.options?.[0] || '';
                }
                // For schoolNationalId, if there's only one school (manager view), default to it.
                if (field.name === 'schoolNationalId' && schools && schools.length === 1) {
                    initialValue = schools[0].nationalId;
                }
                acc[field.name as keyof T] = initialValue;
                return acc;
            }, {} as Partial<T>);
            setFormData(initialData);
        }
    }, [editingItem, isEditing, config.formFields, schools]);
    
    const handleCancel = () => {
        setEditingItem(null);
        setIsFormVisible(false);
        setMessage({ type: '', text: '' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
    
        // 1. Build a clean payload from scratch, based on formFields, to ensure correct types.
        const processedPayload: { [key: string]: any } = {};
        for (const field of config.formFields) {
            const name = field.name;
            const rawValue = formData[name as keyof T];
    
            if (field.type === 'number') {
                if (rawValue === '' || rawValue === null || rawValue === undefined) {
                    processedPayload[name] = null; // Use null for empty optional numbers.
                } else {
                    const num = parseFloat(String(rawValue));
                    processedPayload[name] = isNaN(num) ? null : num;
                }
            } else {
                // For 'text' or 'select', ensure it's a string.
                processedPayload[name] = rawValue === undefined || rawValue === null ? '' : String(rawValue);
            }
        }
        
        // 2. Validate the processed payload for required fields.
        for (const fieldName of config.requiredFields) {
            const value = processedPayload[fieldName];
            // A value of 0 is valid, but empty string, null, or undefined are not for required fields.
            if (value === '' || value === null || value === undefined) {
                const fieldLabel = config.formFields.find(f => f.name === fieldName)?.label || fieldName;
                setMessage({ type: 'error', text: `يرجى ملء الحقل الإلزامي: ${fieldLabel.replace('*', '')}` });
                setLoading(false);
                return;
            }
        }
    
        // 3. Send the clean payload to the API.
        let success = false;
        if (isEditing && editingItem) {
            const finalPayload = { ...processedPayload, id: editingItem.id } as T;
            success = await onUpdate(finalPayload);
            if (success) {
                setMessage({ type: 'success', text: 'تم تحديث النتيجة بنجاح!' });
                handleCancel();
            }
        } else {
            const finalPayload = processedPayload as Omit<T, 'id' | 'dateAdded'>;
            success = await onAdd(finalPayload);
            if(success) {
                setMessage({ type: 'success', text: 'تمت إضافة النتيجة بنجاح!' });
                handleCancel();
            }
        }
        
        setLoading(false);
        if (success) {
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    const handleEditClick = (item: T) => setEditingItem(item);

    const handleDeleteClick = (id: number) => {
        if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه النتيجة؟')) {
            onDelete(id);
        }
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

                if (json.length === 0) throw new Error("الملف فارغ.");
                
                const fileHeaders = Object.keys(json[0]);
                if (!config.excelHeaders.every(header => fileHeaders.includes(header))) {
                    throw new Error(`الملف يجب أن يحتوي على الأعمدة التالية: ${config.excelHeaders.join(', ')}.`);
                }
                
                const validationErrors: string[] = [];
                const validItems: Omit<T, 'id' | 'dateAdded'>[] = [];

                json.forEach((row, index) => {
                    const rowNumber = index + 2; // Excel rows are 1-based, with row 1 as headers.
                    const item: Partial<T> = {};
                    const errorMessagesForRow: string[] = [];

                    // Process and parse all fields for the row.
                    for (const field of config.formFields) {
                        const rawValue = row[field.name];
                        
                        if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '') {
                            if (field.type === 'number') {
                                const num = Number(rawValue);
                                if (isNaN(num)) {
                                    errorMessagesForRow.push(`حقل '${field.label.replace('*', '')}' يجب أن يكون رقمًا (القيمة: '${rawValue}')`);
                                } else {
                                    item[field.name as keyof T] = num as any;
                                }
                            } else {
                                item[field.name as keyof T] = String(rawValue) as any;
                            }
                        }
                    }

                    // Validate required fields for the processed row.
                    for (const fieldName of config.requiredFields) {
                        const value = item[fieldName as keyof T];
                        if (value === undefined || value === null || String(value).trim() === '') {
                            const fieldLabel = config.formFields.find(f => f.name === fieldName)?.label || fieldName;
                            // Prevent duplicate messages if parsing already failed.
                            if (!errorMessagesForRow.some(msg => msg.includes(fieldLabel.replace('*', '')))) {
                               errorMessagesForRow.push(`حقل '${fieldLabel.replace('*', '')}' مطلوب`);
                            }
                        }
                    }

                    if (errorMessagesForRow.length === 0) {
                        validItems.push(item as Omit<T, 'id' | 'dateAdded'>);
                    } else {
                        validationErrors.push(` • الصف ${rowNumber}: ${errorMessagesForRow.join('، ')}`);
                    }
                });

                let successMessage = '';
                let wasApiCallSuccessful = true;

                if (validItems.length > 0) {
                    const success = await onAddMultiple(validItems);
                    if (success) {
                        successMessage = `✅ تم استيراد ${validItems.length} سجل بنجاح.`;
                    } else {
                        wasApiCallSuccessful = false;
                    }
                }

                if (validationErrors.length > 0) {
                    const errorHeader = `❌ فشل استيراد ${validationErrors.length} سجل للأسباب التالية:`;
                    const errorDetails = validationErrors.slice(0, 5).join('\n');
                    const moreErrorsMessage = validationErrors.length > 5 ? `\n... و ${validationErrors.length - 5} أخطاء أخرى.` : '';

                    const validationErrorText = `${errorHeader}\n${errorDetails}${moreErrorsMessage}`;
                    setMessage({ type: 'error', text: `${successMessage}\n\n${validationErrorText}`.trim() });
                } else if (!wasApiCallSuccessful) {
                    // API error will be shown via the apiError prop, but we can set a context message.
                    setMessage({ type: 'error', text: `${successMessage}\n\n❌ حدث خطأ أثناء حفظ السجلات الصالحة.`.trim()});
                } else if (!successMessage) {
                    setMessage({ type: 'error', text: "الملف فارغ أو لا يحتوي على أي بيانات صالحة للاستيراد."});
                } else {
                    setMessage({ type: 'success', text: successMessage });
                }

            } catch (error: any) {
                setMessage({ type: 'error', text: error.message || 'حدث خطأ أثناء معالجة الملف.' });
            } finally {
                if (e.target) e.target.value = '';
                // Don't auto-hide message if there are errors to read.
                if(!message.text.includes('❌')) {
                    setTimeout(() => setMessage({ type: '', text: '' }), 10000);
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const getDisplayValue = (item: T, accessor: keyof T): React.ReactNode => {
        const value = item[accessor];

        if (accessor === 'schoolNationalId' && schools) {
            const school = schools.find(s => s.nationalId === String(value));
            return school 
                ? <div className="flex flex-col"><span className="font-semibold text-slate-800">{school.schoolNameAr}</span><span className="text-xs text-slate-500">{String(value)}</span></div>
                : String(value);
        }

        return String(value);
    };

    const filteredData = data.filter(item => {
        const searchTermLower = searchTerm.toLowerCase();
        if (searchTermLower === '') {
            return true;
        }

        if (schools && item.schoolNationalId) {
            const schoolNationalIdStr = String(item.schoolNationalId);
            const school = schools.find(s => s.nationalId === schoolNationalIdStr);
            return (
                schoolNationalIdStr.toLowerCase().includes(searchTermLower) ||
                (school && school.schoolNameAr.toLowerCase().includes(searchTermLower)) ||
                (school && school.schoolNameEn && school.schoolNameEn.toLowerCase().includes(searchTermLower))
            );
        }

        return Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTermLower)
        );
    });
    
    // FIX: Combine local messages and API errors for a unified display.
    const finalMessage = message.text ? message : apiError ? { type: 'error', text: apiError } : null;

    return (
        <div>
            {isFormVisible && !readOnly ? (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <h3 className="text-xl font-bold mb-4 text-slate-700">{isEditing ? `تعديل نتيجة ${title}` : `إضافة نتيجة ${title}`}</h3>
                     {finalMessage && (
                        <p className={`${finalMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} p-3 rounded-lg my-4 text-sm whitespace-pre-wrap`}>{finalMessage.text}</p>
                     )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {config.formFields.map(field => {
                                if (field.name === 'schoolNationalId' && schools) {
                                    return (
                                        <div key={field.name}>
                                            <label htmlFor={field.name} className="block text-sm font-medium text-slate-600 mb-1">{field.label}</label>
                                            <select
                                                name={field.name}
                                                id={field.name}
                                                value={formData[field.name as keyof T] as string || ''}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                                                disabled={schools.length === 1}
                                            >
                                                <option value="">-- اختر مدرسة --</option>
                                                {schools.sort((a,b) => a.schoolNameAr.localeCompare(b.schoolNameAr)).map(school => (
                                                    <option key={school.nationalId} value={school.nationalId}>
                                                        {school.schoolNameAr} ({school.nationalId})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div key={field.name}>
                                        <label htmlFor={field.name} className="block text-sm font-medium text-slate-600 mb-1">{field.label}</label>
                                        {field.type === 'select' ? (
                                            <select name={field.name} id={field.name} value={formData[field.name as keyof T] as string || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                                                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input type={field.type} name={field.name} id={field.name} value={formData[field.name as keyof T] as string | number || ''} onChange={handleChange} placeholder={field.placeholder} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-4 pt-2">
                            <button type="submit" disabled={loading} className="bg-sky-600 text-white font-bold py-2 px-5 rounded-md hover:bg-sky-700 transition disabled:bg-slate-400">{loading ? 'جاري الحفظ...' : (isEditing ? 'حفظ التعديلات' : 'إضافة النتيجة')}</button>
                            <button type="button" onClick={handleCancel} className="bg-slate-200 text-slate-700 font-bold py-2 px-5 rounded-md hover:bg-slate-300 transition">إلغاء</button>
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                        <div className="relative w-full sm:w-auto sm:flex-grow">
                             <input type="text" placeholder={schools ? `ابحث باسم المدرسة أو الرقم الوطني...` : `ابحث في نتائج ${title}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="w-5 h-5 text-slate-400" /></div>
                        </div>
                        {!readOnly && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button onClick={() => setIsFormVisible(true)} className="w-full sm:w-auto bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-700 transition">إضافة نتيجة جديدة</button>
                                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" style={{ display: 'none' }} />
                                <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition">استيراد Excel</button>
                            </div>
                        )}
                    </div>
                    {finalMessage && !isFormVisible && <p className={`${finalMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} p-3 rounded-lg my-4 text-sm whitespace-pre-wrap`}>{finalMessage.text}</p>}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                <tr>
                                    {config.listColumns.map(col => <th key={col.header} className="px-6 py-3">{col.header}</th>)}
                                    {!readOnly && <th className="px-6 py-3">إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0 ? filteredData.map(item => (
                                    <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                                        {config.listColumns.map(col => <td key={col.accessor as string} className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{getDisplayValue(item, col.accessor)}</td>)}
                                        {!readOnly && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => handleEditClick(item)} className="text-slate-400 hover:text-sky-500"><EditIcon className="w-5 h-5" /></button>
                                                    <button onClick={() => handleDeleteClick(item.id)} className="text-slate-400 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                )) : (
                                    <tr><td colSpan={config.listColumns.length + (readOnly ? 0 : 1)} className="text-center py-10 text-slate-500">{searchTerm ? 'لا توجد نتائج مطابقة لبحثك' : `لا توجد نتائج لعرضها في ${title}.`}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};