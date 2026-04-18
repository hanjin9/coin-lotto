/**
 * Deadline Timer - 마감 타이머 컴포넌트
 * 응모 마감까지의 시간을 실시간으로 표시합니다.
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface DeadlineTimerProps {
  deadlineTime: Date;
  onDeadlineReached?: () => void;
  isLocked?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function DeadlineTimer({ deadlineTime, onDeadlineReached, isLocked }: DeadlineTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const deadline = new Date(deadlineTime).getTime();
      const difference = deadline - now;

      if (difference <= 0) {
        setIsDeadlinePassed(true);
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
        });
        onDeadlineReached?.();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        totalSeconds: Math.floor(difference / 1000),
      });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [deadlineTime, onDeadlineReached]);

  if (!timeRemaining) {
    return <div className="text-slate-400">로드 중...</div>;
  }

  // 마감 상태
  if (isDeadlinePassed || isLocked) {
    return (
      <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-700/50 p-6">
        <div className="text-center">
          <p className="text-red-400 text-sm font-semibold mb-2">🔒 응모 마감됨</p>
          <p className="text-red-300 text-lg">응모가 종료되었습니다.</p>
          <p className="text-red-400 text-xs mt-2">
            {new Date(deadlineTime).toLocaleString('ko-KR')}
          </p>
        </div>
      </Card>
    );
  }

  // 긴급 상태 (1시간 이하)
  if (timeRemaining.totalSeconds <= 3600) {
    return (
      <Card className="bg-gradient-to-br from-red-900/30 to-orange-800/30 border-red-600/50 p-6 animate-pulse">
        <div className="text-center">
          <p className="text-red-400 text-sm font-semibold mb-3">⏰ 응모 마감 임박!</p>
          <div className="flex justify-center gap-4 mb-4">
            <div className="bg-red-500/20 rounded-lg p-3 min-w-16">
              <p className="text-red-400 text-2xl font-bold">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </p>
              <p className="text-red-400 text-xs">분</p>
            </div>
            <div className="text-red-400 text-2xl font-bold">:</div>
            <div className="bg-red-500/20 rounded-lg p-3 min-w-16">
              <p className="text-red-400 text-2xl font-bold">
                {String(timeRemaining.seconds).padStart(2, '0')}
              </p>
              <p className="text-red-400 text-xs">초</p>
            </div>
          </div>
          <p className="text-red-300 text-xs">서둘러 응모하세요!</p>
        </div>
      </Card>
    );
  }

  // 일반 상태
  return (
    <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-600/50 p-6">
      <div className="text-center">
        <p className="text-cyan-400 text-sm font-semibold mb-4">⏱️ 응모 마감까지</p>
        <div className="flex justify-center gap-2 mb-4">
          {timeRemaining.days > 0 && (
            <>
              <div className="bg-cyan-500/20 rounded-lg p-3 min-w-16">
                <p className="text-cyan-400 text-2xl font-bold">
                  {String(timeRemaining.days).padStart(2, '0')}
                </p>
                <p className="text-cyan-400 text-xs">일</p>
              </div>
              <div className="text-cyan-400 text-2xl font-bold">:</div>
            </>
          )}
          <div className="bg-cyan-500/20 rounded-lg p-3 min-w-16">
            <p className="text-cyan-400 text-2xl font-bold">
              {String(timeRemaining.hours).padStart(2, '0')}
            </p>
            <p className="text-cyan-400 text-xs">시간</p>
          </div>
          <div className="text-cyan-400 text-2xl font-bold">:</div>
          <div className="bg-cyan-500/20 rounded-lg p-3 min-w-16">
            <p className="text-cyan-400 text-2xl font-bold">
              {String(timeRemaining.minutes).padStart(2, '0')}
            </p>
            <p className="text-cyan-400 text-xs">분</p>
          </div>
          <div className="text-cyan-400 text-2xl font-bold">:</div>
          <div className="bg-cyan-500/20 rounded-lg p-3 min-w-16">
            <p className="text-cyan-400 text-2xl font-bold">
              {String(timeRemaining.seconds).padStart(2, '0')}
            </p>
            <p className="text-cyan-400 text-xs">초</p>
          </div>
        </div>
        <p className="text-cyan-300 text-xs">
          {new Date(deadlineTime).toLocaleString('ko-KR')}
        </p>
      </div>
    </Card>
  );
}
