// src/pages/index.tsx
import type { NextPage } from 'next';
import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { trpc } from '../utils/trpc';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TicketInvoice from '../components/TicketInvoice';
import Rekognition from 'aws-sdk/clients/rekognition';
import S3 from 'aws-sdk/clients/s3';

const Home: NextPage = () => {
  const webcamRef = useRef<Webcam>(null);
  const [passengerName, setPassengerName] = useState('');
  const [aadharNum, setAadharNum] = useState('');
  const [trainFrom, setTrainFrom] = useState('');
  const [trainTo, setTrainTo] = useState('');
  const [trainNumber, setTrainNumber] = useState('');
  const [ticketInfo, setTicketInfo] = useState<any | null>(null);

  const indexFace = trpc.useMutation('indexFace');
  const searchFaceByImage = trpc.useMutation('searchFaceByImage');
  const clearUserData = trpc.useMutation('clearUserData');

  const handleIndexFace = useCallback(() => {
    const imageSrc = webcamRef?.current?.getScreenshot();
    if (imageSrc) {
      if (aadharNum.length !== 12 || !/^\d{12}$/.test(aadharNum)) {
        toast.error('Aadhar card should be 12 digits');
        return;
      }

      indexFace.mutate(
        { image: imageSrc, name: passengerName, aadhar: aadharNum, from: trainFrom, to: trainTo, trainNumber },
        {
          onSuccess: () => {
            toast.success('User Registered!');
          },
          onError: () => {
            toast.error('Failed to register user.');
          },
        }
      );
    }
  }, [webcamRef, passengerName, aadharNum, trainFrom, trainTo, trainNumber]);

  const handleSearchFace = useCallback(async () => {
    const imageSrc = webcamRef?.current?.getScreenshot();
    if (imageSrc) {
      await searchFaceByImage.mutate(
        { image: imageSrc },
        {
          onSuccess(data) {
            if (data.matchedFaces && data.matchedFaces.length > 0) {
              toast.success('User Recognized!');
              setTicketInfo({
                imageSrc,
                name: data.userInfo[0]?.name ?? '',
                aadhar: data.userInfo[0]?.aadhar ?? '',
                from: data.userInfo[0]?.from ?? '',
                to: data.userInfo[0]?.to ?? '',
                trainNumber: data.userInfo[0]?.trainNumber ?? '',
              });
            } else {
              toast.info('No User Recognized.');
            }
          },
          onError: () => {
            toast.error('Failed to search for user.');
          },
        }
      );
    }
  }, [webcamRef, searchFaceByImage]);

  const handleClearUserData = () => {
    clearUserData.mutate(undefined, {
      onSuccess: () => {
        toast.success('All user data cleared!');
        setTicketInfo(null);
      },
      onError: () => {
        toast.error('Failed to clear user data.');
      },
    });
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center text-white bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <ToastContainer />
      <div className="absolute inset-0 bg-black opacity-70"></div>

      {/* Header Section with Logo */}
      <header className="z-10 flex items-center space-x-4 mb-6 mt-12">
        <img src="/logo.jpg" alt="DigiRail Logo" className="w-16 h-16 rounded-full" />
        <h1 className="text-3xl font-bold text-blue-400">DigiRail: On Track for a Better Journey</h1>
      </header>

      <div className="z-10 flex flex-col items-center bg-gray-800 bg-opacity-80 p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="mb-4 w-full">
          <input
            type="text"
            placeholder="Enter Passenger Name"
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
            className="bg-gray-700 text-white border w-full p-3 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Enter Aadhar Number"
            value={aadharNum}
            onChange={(e) => setAadharNum(e.target.value)}
            maxLength={12}
            className="bg-gray-700 text-white border w-full p-3 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="From"
            value={trainFrom}
            onChange={(e) => setTrainFrom(e.target.value)}
            className="bg-gray-700 text-white border w-full p-3 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="To"
            value={trainTo}
            onChange={(e) => setTrainTo(e.target.value)}
            className="bg-gray-700 text-white border w-full p-3 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Enter Train Number"
            value={trainNumber}
            onChange={(e) => setTrainNumber(e.target.value)}
            className="bg-gray-700 text-white border w-full p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-lg mb-4 shadow-md border-2 border-blue-500" />

        <div className="flex space-x-2 w-full">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-1/3 transition-colors"
            onClick={handleIndexFace}
          >
            Register
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-1/3 transition-colors"
            onClick={handleSearchFace}
          >
            Search
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-1/3 transition-colors"
            onClick={handleClearUserData}
          >
            Clear
          </button>
        </div>
      </div>

      {ticketInfo && (
        <TicketInvoice
          imageSrc={ticketInfo.imageSrc}
          name={ticketInfo.name}
          aadhar={ticketInfo.aadhar}
          from={ticketInfo.from}
          to={ticketInfo.to}
          trainNumber={ticketInfo.trainNumber}
          onClose={() => setTicketInfo(null)}
        />
      )}
    </div>
  );
};

export default Home;
