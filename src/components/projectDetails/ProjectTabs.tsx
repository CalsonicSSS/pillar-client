'use client';

import { useState } from 'react';
import { CommunicationsTab } from './CommunicationsTab';
import { DocumentsTab } from './DocumentsTab';
import { TodosTab } from './TodosTab';

interface ProjectTabsProps {
  projectId: string;
}

type TabType = 'communications' | 'documents' | 'todos';

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('communications');

  const tabs = [
    { id: 'communications' as const, label: 'Communications' },
    { id: 'documents' as const, label: 'Documents' },
    { id: 'todos' as const, label: 'Todo Lists' },
  ];

  return (
    <div className='bg-white rounded-lg border border-gray-200'>
      {/* Tab Navigation */}
      <div className='border-b border-gray-200'>
        <nav className='flex space-x-8 px-8'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className='p-8'>
        {activeTab === 'communications' && <CommunicationsTab projectId={projectId} />}
        {activeTab === 'documents' && <DocumentsTab projectId={projectId} />}
        {activeTab === 'todos' && <TodosTab projectId={projectId} />}
      </div>
    </div>
  );
}
