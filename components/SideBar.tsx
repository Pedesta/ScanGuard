'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users } from 'lucide-react';

export default function Sidebar(): JSX.Element {
  const pathname = usePathname();

  const isActive = (path: string): string => {
    return pathname === path ? 'bg-gray-100' : '';
  };

  return (
    <div className="w-40 bg-white shadow-lg h-screen">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800">ScanGuard</h1>
      </div>
      
      <nav className="mt-6">
        <Link href="/dashboard" 
          className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${isActive('/dashboard')}`}>
          <LayoutDashboard className="h-5 w-5 mr-3" />
          Dashboard
        </Link>
        
        <Link href="/dashboard/visitors" 
          className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${isActive('/dashboard/visitors')}`}>
          <Users className="h-5 w-5 mr-3" />
          Visitors
        </Link>
        
        <Link href="/dashboard/reports" 
          className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${isActive('/dashboard/reports')}`}>
          <Users className="h-5 w-5 mr-3" />
          Reports
        </Link>
      </nav>
    </div>
  );
}
