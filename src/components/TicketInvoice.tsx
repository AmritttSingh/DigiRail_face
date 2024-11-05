// src/components/TicketInvoice.tsx
import React from 'react';

interface TicketInvoiceProps {
  imageSrc: string;
  name: string;
  aadhar: string;
  from: string;
  to: string;
  trainNumber: string;
  onClose: () => void;
}

const TicketInvoice: React.FC<TicketInvoiceProps> = ({
  imageSrc,
  name,
  aadhar,
  from,
  to,
  trainNumber,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
      <div className="bg-gray-900 text-white rounded-lg p-6 shadow-lg max-w-sm w-full">
        <button className="text-red-500 font-bold float-right" onClick={onClose}>
          X
        </button>
        <h2 className="text-xl font-bold mb-4 text-center">Have a Safe Journey</h2>
        <div className="flex justify-center mb-4">
          <img src={imageSrc} alt="Passenger" className="rounded-full w-32 h-32 border-2 border-blue-500" />
        </div>
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Aadhar Number:</strong> {aadhar}</p>
        <p><strong>From:</strong> {from}</p>
        <p><strong>To:</strong> {to}</p>
        <p><strong>Train Number:</strong> {trainNumber}</p>
      </div>
    </div>
  );
};

export default TicketInvoice;
