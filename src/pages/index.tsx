// src/pages/index.tsx
import { Rekognition } from 'aws-sdk';
import type { NextPage } from 'next';
import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { trpc } from '../utils/trpc';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Home: NextPage = () => {
  const webcamRef = useRef<Webcam>(null);
  const [passengerName, setPassengerName] = useState('');
  const [aadharNum, setAadharNum] = useState('');
  const [bestMatchImages, setBestMatchImages] = useState<(string | undefined)[]>([]);
  const [matchResult, setMatchResult] = useState<Rekognition.FaceMatchList>();
  const [userInfo, setUserInfo] = useState<{ name?: string; aadhar?: string }[]>([]);

  const indexFace = trpc.useMutation('indexFace');
  const searchFaceByImage = trpc.useMutation('searchFaceByImage');
  const clearUserData = trpc.useMutation('clearUserData');

  const handleIndexFace = useCallback(() => {
    const imageSrc = webcamRef?.current?.getScreenshot();
    if (imageSrc) {
      indexFace.mutate(
        { image: imageSrc, name: passengerName, aadhar: aadharNum },
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
  }, [webcamRef, passengerName, aadharNum]);

  const handleSearchFace = useCallback(async () => {
    const imageSrc = webcamRef?.current?.getScreenshot();
    if (imageSrc) {
      await searchFaceByImage.mutate(
        { image: imageSrc },
        {
          onSuccess(data) {
            setMatchResult(data.matchedFaces);
            setBestMatchImages(data.images ?? []);
            setUserInfo(data.userInfo ?? []);

            if (data.matchedFaces.length > 0) {
              toast.success('User Recognized!');
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
  }, [webcamRef]);

  const handleClearUserData = () => {
    clearUserData.mutate(undefined, {
      onSuccess: () => {
        toast.success('All user data cleared!');
      },
      onError: () => {
        toast.error('Failed to clear user data.');
      },
    });
  };

  return (
    <div className="p-4">
      <ToastContainer />
      <div className="flex flex-col items-center">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter Passenger Name"
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
            className="border p-2 rounded mb-2"
          />
          <input
            type="text"
            placeholder="Enter Aadhar Number"
            value={aadharNum}
            onChange={(e) => setAadharNum(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-xl mb-4" />

        <div className="flex space-x-2">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleIndexFace}
          >
            Register Face
          </button>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleSearchFace}
          >
            Search Face
          </button>
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleClearUserData}
          >
            Clear User Data
          </button>
        </div>

        {bestMatchImages.length > 0 &&
          bestMatchImages.map((image, index) => (
            <div key={index} className="flex justify-center items-center mt-6">
              <img
                className="w-64 h-64 object-cover rounded-md"
                src={'data:image/jpeg;base64,' + image}
                alt="Matched face"
              />
              <div className="ml-4">
                {matchResult && (
                  <div>
                    <div>Similarity: {(matchResult[index]?.Similarity ?? 0).toFixed(2)}%</div>
                    <div>Passenger Name: {userInfo[index]?.name || 'N/A'}</div>
                    <div>Aadhar Number: {userInfo[index]?.aadhar || 'N/A'}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Home;