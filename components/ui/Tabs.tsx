import React from 'react';

interface TabsProps {
    tabs: string[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
    return (
        <div className="border-b border-slate-200">
            <nav className="-mb-px flex gap-6" aria-label="Tabs">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            whitespace-nowrap py-3 px-1 border-b-2 font-medium text-md transition-colors
                            ${
                                activeTab === tab
                                ? 'border-sky-500 text-sky-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }
                        `}
                        aria-current={activeTab === tab ? 'page' : undefined}
                    >
                        {tab}
                    </button>
                ))}
            </nav>
        </div>
    );
}
