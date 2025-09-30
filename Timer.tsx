import React, { useEffect, useState } from 'react';

interface TimerProps {
  endTime: Date;
  status: 'active' | 'ended' | 'upcoming';
}

export const Timer: React.FC<TimerProps> = ({ endTime, status }) => {
  const [timeLeft, setTimeLeft] = useState(endTime.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(endTime.getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (status === 'ended') {
    return <span className="text-red-600 font-semibold">Auction Ended</span>;
  }

  if (status === 'upcoming') {
    return <span className="text-gray-600">Coming Soon</span>;
  }

  const minutes = Math.floor(timeLeft / 1000 / 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
      <span className="text-blue-600 font-semibold">
      {minutes}:{seconds.toString().padStart(2, '0')} left
    </span>
  );
};
