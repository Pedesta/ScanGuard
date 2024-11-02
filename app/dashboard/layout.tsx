'use client'

import { useEffect, type ReactNode, useState } from 'react';
import { useVisitorStore } from '@/store/visitor-store'
import Sidebar from '@/components/SideBar';
import WebcamModal from '@/components/WebcamModal';

export default function DshboardLayout({ children }: { children: ReactNode }) {
  const { setVisitors } = useVisitorStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const response = await fetch('/api/visitors');
        if (!response.ok) {
          throw new Error('Failed to fetch visitors');
        }
        const data = await response.json();
        setVisitors(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisitors();
  }, [setVisitors]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        {children}
      </div>
      <WebcamModal />
    </div>
  );
}