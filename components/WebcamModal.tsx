'use client';
import { useState, useRef } from 'react';
import { useVisitorStore } from '@/store/visitor-store'
import Swal from 'sweetalert2';

export default function WebcamModal(): JSX.Element {
  const { addVisitor, setCapturing, capturing } = useVisitorStore();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async (): Promise<void> => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.log(`${err}`);
    }
  };

  const stopCamera = (): void => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const closeCamera = (): void => {
    const modal = document.getElementById('webcam-modal') as HTMLDialogElement;
    modal?.close();
  }

  const captureImage = async (): Promise<void> => {
    if (videoRef.current) {
      try {
        setCapturing(true);
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext('2d');
        
        if (context) {
          context.drawImage(videoRef.current, 0, 0);
          const imageData = canvas.toDataURL('image/png');
          // stopCamera
          stopCamera()
          // close camera window
          closeCamera();
          
          // Save to database
          const response = await fetch('/api/visitors', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: imageData,
            }),
          });

          if (!response.ok) {
            const data = await response.json()
            Swal.fire({
                icon: 'error',
                title: 'Oops!!',
                text: `${data.message}`.replace(/Error:/g, '')
            });
            return;
          }
          const data = await response.json()
          addVisitor(data.visitor)
        }
      } catch (error) {
        console.log(`${error}`);
      } finally {
        setCapturing(false);
      }
    }
  };

  return (
    <dialog id="webcam-modal" className="modal p-6 rounded-lg shadow-xl bg-white">
      <div className="max-w-2xl">
        <div className="relative mb-4">
          <video
            ref={videoRef}
            className="w-[440px] h-[280px] rounded"
            autoPlay
            playsInline
          />
        </div>
        
        <div className="flex gap-4">
          {!stream ? (
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={captureImage}
                disabled={capturing}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {capturing ? 'Saving...' : 'Capture'}
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Stop Camera
              </button>
            </>
          )}
          <button
            onClick={() => {
              stopCamera();
              closeCamera();
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}