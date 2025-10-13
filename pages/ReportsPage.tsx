import React, { useState, useEffect } from 'react';
import type { School, TestResult, TimssResult, PisaResult, PirlsResult, NationalTestResult, AssessmentTestResult, UnifiedTestResult, LiteracyNumeracyResult, AloResult } from '../types';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { Tabs } from '../components/ui/Tabs';
import { ComparativeReport } from '../components/ComparativeReport';
import { SingleSchoolTrendReport } from '../components/SingleSchoolTrendReport';
import * as api from '../services/apiService';

// Make sure XLSX is available in the global scope from the CDN
declare var XLSX: any;

const testTypes = {
    timssResults: "TIMSS",
    pisaResults: "PISA",
    pirlsResults: "PIRLS",
    nationalTestResults: "الاختبار الوطني",
    assessmentTestResults: "الاختبار التقييمي",
    unifiedTestResults: "الاختبار الموحد",
    literacyNumeracyResults: "القرائية والحساب",
    aloResults: "تقييم مخرجات التعلم (ALO)"
};

export interface AllResults {
    timssResults: TimssResult[];
    pisaResults: PisaResult[];
    pirlsResults: PirlsResult[];
    nationalTestResults: NationalTestResult[];
    assessmentTestResults: AssessmentTestResult[];
    unifiedTestResults: UnifiedTestResult[];
    literacyNumeracyResults: LiteracyNumeracyResult[];
    aloResults: AloResult[];
}

const SchoolReportsView: React.FC<{schools: School[], allResults: AllResults}> = ({ schools, allResults }) => {
    const { timssResults, pisaResults, pirlsResults, nationalTestResults, assessmentTestResults, unifiedTestResults, literacyNumeracyResults, aloResults } = allResults;
    
    const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
    const [showReport, setShowReport] = useState(false);

    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, (option: { value: string }) => option.value);
        setSelectedSchoolIds(selectedOptions);
        setShowReport(false); // Hide old report when selection changes
    };

    const handleGenerateReport = () => {
        if (selectedSchoolIds.length > 0) {
            setShowReport(true);
        }
    };

    const getSchoolResults = (schoolId: string) => {
        return {
            timssResults: timssResults.filter(r => String(r.schoolNationalId) === schoolId),
            pisaResults: pisaResults.filter(r => String(r.schoolNationalId) === schoolId),
            pirlsResults: pirlsResults.filter(r => String(r.schoolNationalId) === schoolId),
            nationalTestResults: nationalTestResults.filter(r => String(r.schoolNationalId) === schoolId),
            assessmentTestResults: assessmentTestResults.filter(r => String(r.schoolNationalId) === schoolId),
            unifiedTestResults: unifiedTestResults.filter(r => String(r.schoolNationalId) === schoolId),
            literacyNumeracyResults: literacyNumeracyResults.filter(r => String(r.schoolNationalId) === schoolId),
            aloResults: aloResults.filter(r => String(r.schoolNationalId) === schoolId),
        };
    };
    
    const handleExportReport = () => {
        if (typeof XLSX === 'undefined') {
            alert('حدث خطأ أثناء محاولة التصدير. يرجى المحاولة مرة أخرى.');
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws_data: (string | number)[][] = [];

        const headerLine1 = "وكالة الغوث الدولية - برنامج التربية والتعليم";
        const headerLine2 = "مركز التطوير التربوي - وحدة التقويم";

        ws_data.push([headerLine1]);
        ws_data.push([headerLine2]);
        ws_data.push([]); 

        let maxCols = 0;

        selectedSchoolIds.forEach(schoolId => {
            const school = schools.find(s => s.nationalId === schoolId);
            if (!school) return;

            ws_data.push([`المدرسة: ${school.schoolNameAr}`, `الرقم الوطني: ${school.nationalId}`]);
            ws_data.push([]);

            const schoolResults = getSchoolResults(schoolId);

            Object.entries(schoolResults).forEach(([testKey, results]) => {
                if (results.length > 0) {
                    const title = testTypes[testKey as keyof typeof testTypes];
                    ws_data.push([title]);

                    const headers = Object.keys(results[0]).filter(key => !['id', 'dateAdded', 'schoolNationalId'].includes(key));
                    if (headers.length > maxCols) {
                        maxCols = headers.length;
                    }
                    ws_data.push(headers);

                    results.forEach(result => {
                        const row = headers.map(header => {
                            const value = (result as Record<string, any>)[header];
                            if (typeof value === 'number' && (header.toLowerCase().includes('score') || header.toLowerCase().includes('rate'))) {
                                return Number(value.toFixed(1));
                            }
                            return value;
                        });
                        ws_data.push(row);
                    });

                    ws_data.push([]);
                }
            });

            ws_data.push([]);
        });
        
        if (ws_data.length <= 3) {
            alert("لا توجد بيانات لتصديرها.");
            return;
        }
        
        if (maxCols < 2) maxCols = 2;

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        if (!ws['!props']) ws['!props'] = {};
        ws['!props'].RTL = true;
        
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: maxCols - 1 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: maxCols - 1 } },
        ];

        XLSX.utils.book_append_sheet(wb, ws, "تقرير المدارس");
        XLSX.writeFile(wb, `School_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const TestResultsTable: React.FC<{ title: string, results: TestResult[] }> = ({ title, results }) => {
        if (results.length === 0) {
            return null;
        }
        
        const headers = Object.keys(results[0]).filter(key => !['id', 'dateAdded', 'schoolNationalId'].includes(key));

        const renderCell = (value: any, header: string) => {
            if (typeof value === 'number' && (header.toLowerCase().includes('score') || header.toLowerCase().includes('rate'))) {
                return value.toFixed(1);
            }
            return String(value);
        };

        return (
            <div className="mb-6">
                <h4 className="text-lg font-bold text-sky-800 mb-2">{title}</h4>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-slate-600 border border-slate-200">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                {headers.map(header => <th key={header} className="px-4 py-2 border-l border-slate-200">{header}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {results.map((result, index) => (
                                <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                                    {headers.map(header => <td key={header} className="px-4 py-2 border-l border-slate-200 whitespace-nowrap">{renderCell((result as Record<string, any>)[header], header)}</td>)}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-2xl font-bold text-slate-700 mb-4">إنشاء تقارير المدارس</h2>
                <p className="text-slate-500 mb-6">اختر مدرسة واحدة أو أكثر لعرض جميع نتائج اختباراتها المسجلة في النظام وتصديرها.</p>
                
                <div>
                    <label htmlFor="school-multiselect" className="block text-sm font-medium text-slate-600 mb-2">
                        المدارس المتاحة ({schools.length})
                    </label>
                    <select
                        id="school-multiselect"
                        multiple
                        value={selectedSchoolIds}
                        onChange={handleSelectionChange}
                        className="w-full h-40 p-3 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition bg-white"
                        aria-describedby="school-multiselect-description"
                    >
                        {schools.sort((a,b) => a.schoolNameAr.localeCompare(b.schoolNameAr)).map(school => (
                            <option key={school.nationalId} value={school.nationalId}>
                                {school.schoolNameAr} - ({school.nationalId})
                            </option>
                        ))}
                    </select>
                     <p id="school-multiselect-description" className="mt-2 text-sm text-slate-500">
                        يمكنك تحديد عدة مدارس بالضغط على <kbd>Ctrl</kbd> (أو <kbd>Cmd</kbd> على Mac) أثناء النقر.
                    </p>
                </div>
                
                <button
                    onClick={handleGenerateReport}
                    disabled={selectedSchoolIds.length === 0}
                    className="mt-6 w-full sm:w-auto bg-sky-600 text-white font-bold py-3 px-8 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    إنشاء التقرير
                </button>
            </div>

            {showReport && (
                <div className="space-y-6">
                     <div className="flex justify-between items-center border-b pb-2 mb-4">
                        <h3 className="text-2xl font-bold text-slate-700">التقرير المطلوب</h3>
                        {selectedSchoolIds.length > 0 && (
                            <button
                                onClick={handleExportReport}
                                className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                <span>تصدير إلى Excel</span>
                            </button>
                        )}
                    </div>
                    {selectedSchoolIds.map(schoolId => {
                        const school = schools.find(s => s.nationalId === schoolId);
                        if (!school) return null;
                        
                        const schoolResults = getSchoolResults(schoolId);
                        const hasAnyResults = Object.values(schoolResults).some(res => res.length > 0);

                        return (
                            <div key={schoolId} className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-xl font-bold text-sky-700 mb-1">{school.schoolNameAr}</h3>
                                <p className="text-sm text-slate-500 mb-6">الرقم الوطني: {school.nationalId}</p>

                                {hasAnyResults ? (
                                    <>
                                        <TestResultsTable title={testTypes.timssResults} results={schoolResults.timssResults} />
                                        <TestResultsTable title={testTypes.pisaResults} results={schoolResults.pisaResults} />
                                        <TestResultsTable title={testTypes.pirlsResults} results={schoolResults.pirlsResults} />
                                        <TestResultsTable title={testTypes.nationalTestResults} results={schoolResults.nationalTestResults} />
                                        <TestResultsTable title={testTypes.assessmentTestResults} results={schoolResults.assessmentTestResults} />
                                        <TestResultsTable title={testTypes.unifiedTestResults} results={schoolResults.unifiedTestResults} />
                                        <TestResultsTable title={testTypes.literacyNumeracyResults} results={schoolResults.literacyNumeracyResults} />
                                        <TestResultsTable title={testTypes.aloResults} results={schoolResults.aloResults} />
                                    </>
                                ) : (
                                    <p className="text-slate-500 text-center py-4">لا توجد أي نتائج اختبارات مسجلة لهذه المدرسة.</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};


const ReportsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('تقارير المدارس');
    const [schools, setSchools] = useState<School[]>([]);
    const [allResults, setAllResults] = useState<AllResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Use the new single endpoint to get all data efficiently
                const data = await api.getReportData();

                setSchools(data.schools);
                setAllResults({ 
                    timssResults: data.timssResults, 
                    pisaResults: data.pisaResults, 
                    pirlsResults: data.pirlsResults, 
                    nationalTestResults: data.nationalTestResults, 
                    assessmentTestResults: data.assessmentTestResults, 
                    unifiedTestResults: data.unifiedTestResults, 
                    literacyNumeracyResults: data.literacyNumeracyResults, 
                    aloResults: data.aloResults 
                });

            } catch (err: any) {
                setError(err.message || 'فشل في تحميل بيانات التقارير.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    if (loading) {
        return (
             <div className="text-center p-10 bg-white rounded-lg shadow-md">
                <p className="text-slate-500 text-lg">جاري تحميل بيانات التقارير من الخادم...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center p-10 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-md">
                <p className="font-bold">حدث خطأ</p>
                <p>{error}</p>
            </div>
        );
    }

    if (!allResults) {
        return null;
    }


    return (
         <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-700">إنشاء التقارير</h2>
             <Tabs
                tabs={['تقارير المدارس', 'التقرير المقارن', 'مقارنة الكيانات']}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
            {activeTab === 'تقارير المدارس' && <SchoolReportsView schools={schools} allResults={allResults} />}
            {activeTab === 'التقرير المقارن' && <SingleSchoolTrendReport schools={schools} allResults={allResults} />}
            {activeTab === 'مقارنة الكيانات' && <ComparativeReport schools={schools} allResults={allResults} />}
        </div>
    );
};

export default ReportsPage;