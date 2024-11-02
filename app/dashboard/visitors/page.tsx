'use client'

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { useVisitorStore } from '@/store/visitor-store'
import { calculateStay, formatDatetime } from '@/utils'
import VisitorModal from '@/components/VisitorModal';

import { Visitor } from '@/types';

export default function Visitors() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Partial<Visitor> | undefined>();
  const { visitors, capturing, updateVisitor } = useVisitorStore();

  const handleCheckout = async (visitorId: string) => {
    if (confirm('Are you sure you want to check out this visitor?')) {
      try {
        const response = await fetch(`/api/visitors/${visitorId}`, {
          method: 'POST',
        });
        if (!response.ok) {
          throw new Error('Failed to check out visitor');
        }
        const updated = await response.json();
        console.log("updated checkout ", updated.visitor)
        updateVisitor(updated.visitor);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'An error occurred');
      }
    }
  };

  // For creating a new visitor
  const handleCreate = () => {
    setSelectedVisitor(undefined);
    setIsModalOpen(true);
  };

  // For updating an existing visitor
  const handleUpdate = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setIsModalOpen(true);
  };

  const handleSubmit = async (visitorData: Partial<Visitor>) => {
    try {
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorData),
      });
      
      if (!response.ok) throw new Error('Failed to save visitor');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };


  return (
    <div>
      <div className='flex justify-between items-center'>
        <h2 className="text-2xl font-bold">Visitors Log</h2>
        {capturing ? (
          <div className="flex items-center text-gray-600">
            <svg 
              className="animate-spin h-5 w-5 mr-2" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Capturing...
          </div>
        ) : (
          <div className='flex justify-start items-center'>
            <button
              onClick={() => (document.getElementById('webcam-modal') as HTMLDialogElement)?.showModal()}
              className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100"
            >
              <Camera className="h-5 w-5 mr-3" />
              Capture
            </button>
            <button
              onClick={handleCreate}
              className="text-sm text-white bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded-md ml-2"
            >
              + Manual
            </button>
          </div>
        )}
      </div>
            
      <div className="bg-white rounded-lg shadow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Firstname</th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Surname</th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">BirthDate</th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">In</th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Out</th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Stay</th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visitors.map((visitor) => (
              <tr key={visitor._id}>
                <td className="px-2 py-4 whitespace-nowrap">
                  {!visitor.checkout && (
                    <span className="inline-block w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
                  )}
                  {visitor.firstname}
                </td>
                <td className="px-2 py-1 whitespace-nowrap">{visitor.surname}</td>
                <td className="px-2 py-1 whitespace-nowrap">{visitor.gender}</td>
                <td className="px-2 py-1 whitespace-nowrap">{visitor.birthDate}</td>
                <td className="px-2 py-1 whitespace-nowrap">{visitor.identification}</td>
                <td className="px-2 py-1 whitespace-nowrap">{formatDatetime(visitor.checkin)}</td>
                <td className="px-2 py-1 whitespace-nowrap">
                  {visitor.checkout ? formatDatetime(visitor.checkout) : (
                    <button
                      onClick={() => handleCheckout(visitor._id)}
                      className="text-sm text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-md"
                    >
                      Checkout
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{calculateStay(visitor.checkin, visitor.checkout)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {!visitor.checkout &&
                  <button 
                    onClick={() => handleUpdate(visitor)}
                    className="text-sm text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-md"
                  >
                    Update
                  </button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visitor modal */}
      <VisitorModal
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
        setSelectedVisitor(undefined);
      }}
      onSubmit={handleSubmit}
      initialData={selectedVisitor}
    />
    </div>
  );
}