'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import Swal from 'sweetalert2';

interface VisitorData {
  [key: string]: string | number | Date; // Use 'any' or a more specific type based on your actual data structure
}

interface TransformedData {
  [key: string]: string | number | Date; // Same here; adjust the type as necessary
}

// Function to convert keys to camelCase with the first letter capitalized and remove underscores
const transformData = (data: VisitorData[]): TransformedData[] => {
  return data.map((item: VisitorData): TransformedData => {
    return Object.keys(item).reduce((acc: TransformedData, key: string) => {
      // Convert key to camelCase and capitalize the first letter
      const newKey = key
        .replace(/_\w/g, match => match[1].toUpperCase()) // Remove underscore and capitalize the next letter
        .replace(/^./, match => match.toUpperCase()); // Capitalize the first letter
      acc[newKey] = item[key];
      return acc;
    }, {});
  });
};


export default function Reports(): JSX.Element {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleDownload = async () => {
    if (!startDate || !endDate) {
      Swal.fire({
        icon: 'error',
        title: 'Input Required',
        text: 'Both start and end dates are required!',
      });
      return;
    }

    if (startDate > endDate) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Dates',
        text: 'Start Date cannot be after End Date!',
      });
      return;
    }

    try {
      const response = await fetch(`/api/visitors?start=${startDate}&end=${endDate}`);
      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: 'Oops!!',
          text: 'Failed to fetch visitors data.',
        });
      }

      const data = await response.json();
      if(data.length === 0){
        Swal.fire({
          icon: "info",
          title: "No Data Found!",
          text: "The selected period has no data, change your data ranges."
        })
        return;
      }
      console.log(data)

      const transformedData = transformData(data);
      const headers = Array.from(new Set(transformedData.flatMap(Object.keys)));
      const csv = Papa.unparse(transformedData, {
        columns: headers
      });

      downloadCSV(csv);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops!!',
        text: `${error}`,
      });
    }
  };

  const downloadCSV = (csv: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visitors_${startDate}_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-1">Reports</h2>
      <p className="text-sm italic mb-4">Download line listing reports for your visitor data.</p>
      <hr className="mb-4" />

      <div className="flex justify-start items-center gap-4">
        <div className="mb-4 flex justify-start items-center gap-4">
          <label htmlFor="start-date" className="block mb-1 text-nowrap text-gray-600 font-bold">Start Date:</label>
          <input 
            type="date" 
            id="start-date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div className="mb-4 flex justify-start items-center gap-4">
          <label htmlFor="end-date" className="block mb-1 text-nowrap text-gray-600 font-bold">End Date:</label>
          <input 
            type="date" 
            id="end-date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            className="border rounded px-2 py-1 w-full"
          />
        </div>
      </div>

      <button 
        onClick={handleDownload} 
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-600 transition"
      >
        Download
      </button>
    </div>
  );
}
