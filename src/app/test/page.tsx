"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function TestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(0);
  const [showButton1, setShowButton1] = useState(false);
  const [showButton2, setShowButton2] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);

      // 30초~35초: 오른쪽 상단에서 중앙으로 내려오는 별 버튼
      if (time >= 30 && time <= 35) {
        setShowButton1(true);
      } else {
        setShowButton1(false);
      }

      // 40초~45초: 왼쪽 상단에서 중앙 상단으로 이동하는 별 버튼
      if (time >= 40 && time <= 45) {
        setShowButton2(true);
      } else {
        setShowButton2(false);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  const handleButtonClick = () => {
    router.push("/login");
  };

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src="/mp4/spg.mp4"
        controls
        className="w-full h-full object-contain"
      />

      {/* 30초~35초: 오른쪽 상단 → 중앙 별 버튼 */}
      {showButton1 && (
        <button
          onClick={handleButtonClick}
          className="absolute top-[10%] right-[10%] animate-slide-down-center z-10 cursor-pointer transition-all duration-1000 hover:scale-110"
          style={{
            animation: "slideDownCenter 2s ease-in-out",
          }}
        >
          <div className="text-6xl">⭐</div>
        </button>
      )}

      {/* 40초~45초: 왼쪽 상단 → 중앙 상단 별 버튼 */}
      {showButton2 && (
        <button
          onClick={handleButtonClick}
          className="absolute top-[10%] left-[10%] animate-slide-right-center z-10 cursor-pointer transition-all duration-1000 hover:scale-110"
          style={{
            animation: "slideRightCenter 2s ease-in-out",
          }}
        >
          <div className="text-6xl">⭐</div>
        </button>
      )}

      {/* 디버그용 시간 표시 (나중에 제거 가능) */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded z-20">
        현재 시간: {currentTime.toFixed(1)}초
      </div>

      <style jsx>{`
        @keyframes slideDownCenter {
          0% {
            transform: translate(0, -50px);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(-25%, 200%);
            opacity: 1;
          }
        }

        @keyframes slideRightCenter {
          0% {
            transform: translate(-50px, 0);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translate(400%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

