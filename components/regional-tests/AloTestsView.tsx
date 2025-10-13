import React, { useState } from 'react';
import { TestManager } from '../TestManager';
import { TestResultsChart } from '../charts/TestResultsChart';
import { 
    AloResult, TestResult, School,
    ALO_SUBJECTS, ALO_GRADES
} from '../../types';

interface AloTestsViewProps {
    schools: School[];
    aloResults: AloResult[];
    onAddAlo: (data: Omit<AloResult, 'id' | 'dateAdded'>) => Promise<boolean>;
    onAddMultipleAlo: (data: Omit<AloResult, 'id' | 'dateAdded'>[]) => Promise<boolean>;
    onUpdateAlo: (data: AloResult) => Promise<boolean>;
    onDeleteAlo: (id: number) => Promise<boolean>;
    apiError: string | null;
    isManager?: boolean;
}

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select';
    placeholder?: string;
    options?: readonly string[];
}

interface ListColumn<T extends TestResult> {
    header: string;
    accessor: keyof T;
}

interface TestConfig<T extends TestResult> {
    formFields: FormField[];
    listColumns: ListColumn<T>[];
    requiredFields: string[];
    excelHeaders: string[];
}

const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const TableCellsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 6.75h17.25M3.375 12h17.25m-17.25 5.25h17.25M9 3.75v16.5M15 3.75v16.5" />
  </svg>
);

const AloTestsView: React.FC<AloTestsViewProps> = (props) => {
    const [view, setView] = useState<'data' | 'chart'>('data');

    const aloTestConfig: TestConfig<AloResult> = {
        formFields: [
            { name: 'schoolNationalId', label: 'الرقم الوطني للمدرسة*', type: 'text', placeholder: '200100...' },
            { name: 'year', label: 'السنة*', type: 'number', placeholder: new Date().getFullYear().toString() },
            { name: 'subject', label: 'المبحث*', type: 'select', options: ALO_SUBJECTS },
            { name: 'grade', label: 'الصف*', type: 'select', options: ALO_GRADES },
            { name: 'score', label: 'المتوسط الحسابي*', type: 'number', placeholder: '85.5' },
            { name: 'participationRate', label: 'نسبة المتقدم (%)', type: 'number', placeholder: '95' },
            { name: 'achievedRate', label: 'نسبة المنجز (%)', type: 'number', placeholder: '70' },
            { name: 'partiallyAchievedRate', label: 'نسبة المنجز جزئيا (%)', type: 'number', placeholder: '20' },
            { name: 'notAchievedRate', label: 'نسبة عدم الإنجاز (%)', type: 'number', placeholder: '10' },
        ],
        listColumns: [
            { header: 'المدرسة', accessor: 'schoolNationalId' },
            { header: 'السنة', accessor: 'year' },
            { header: 'المبحث', accessor: 'subject' },
            { header: 'الصف', accessor: 'grade' },
            { header: 'المتوسط', accessor: 'score' },
            { header: 'المشاركة %', accessor: 'participationRate' },
            { header: 'المنجز %', accessor: 'achievedRate' },
        ],
        requiredFields: ['schoolNationalId', 'year', 'subject', 'grade', 'score'],
        excelHeaders: ['schoolNationalId', 'year', 'subject', 'grade', 'score', 'participationRate', 'achievedRate', 'partiallyAchievedRate', 'notAchievedRate'],
    };

    const renderViewToggle = () => (
        <div className="flex justify-end mb-4">
            <div className="inline-flex rounded-md shadow-sm bg-white" role="group">
                <button
                    type="button"
                    onClick={() => setView('data')}
                    className={`relative inline-flex items-center gap-2 rounded-r-md px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 focus:z-10 transition-colors ${
                        view === 'data' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    <TableCellsIcon className="w-5 h-5" />
                    عرض البيانات
                </button>
                <button
                    type="button"
                    onClick={() => setView('chart')}
                    className={`relative inline-flex items-center gap-2 rounded-l-md px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 focus:z-10 transition-colors ${
                        view === 'chart' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    <ChartBarIcon className="w-5 h-5" />
                    عرض الرسم البياني
                </button>
            </div>
        </div>
    );

    return (
        <div>
            {renderViewToggle()}
            <div className="mt-6">
                {view === 'data' ? (
                    <TestManager
                        title="نتائج اختبار ALO"
                        data={props.aloResults}
                        config={aloTestConfig}
                        onAdd={props.onAddAlo}
                        onAddMultiple={props.onAddMultipleAlo}
                        onUpdate={props.onUpdateAlo}
                        onDelete={props.onDeleteAlo}
                        schools={props.schools}
                        readOnly={props.isManager}
                        apiError={props.apiError}
                    />
                ) : (
                    <TestResultsChart
                        title="تحليل نتائج اختبار ALO عبر السنوات"
                        results={props.aloResults}
                        schools={props.schools}
                        subjects={ALO_SUBJECTS}
                        grades={ALO_GRADES}
                        yAxisMin={0}
                        yAxisMax={100}
                        readOnly={props.isManager}
                    />
                )}
            </div>
        </div>
    );
};

export default AloTestsView;
