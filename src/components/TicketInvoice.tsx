// src/components/TicketInvoice.tsx
import React from 'react';

interface TicketInvoiceProps {
  imageSrc: string;
  name: string;
  aadhar: string;
  from: string;
  to: string;
  trainName: string;
  onClose: () => void;
}

const TicketInvoice: React.FC<TicketInvoiceProps> = ({ imageSrc, name, aadhar, from, to, trainName, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-gray-900 p-8 rounded-lg shadow-2xl w-96 relative text-white">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
          ✕
        </button>
        <h2 className="text-2xl font-semibold text-center text-blue-400 mb-6">Have a Safe Journey</h2>
        <div className="flex justify-center mb-4">
          <img src={imageSrc} alt="Passenger" className="w-28 h-28 rounded-full border-4 border-blue-500 shadow-md" />
        </div>
        <div className="space-y-3 text-center text-gray-300">
          <p><strong>Name:</strong> {name}</p>
          <p><strong>Aadhar Number:</strong> {aadhar}</p>
          <p><strong>From:</strong> {from}</p>
          <p><strong>To:</strong> {to}</p>
          <p><strong>Train Name:</strong> {trainName}</p>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-500 hover:bg-blue-700 text-white py-2 rounded-md font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default TicketInvoice;
