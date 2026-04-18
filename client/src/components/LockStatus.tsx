/**
 * Lock Status - 잠금 상태 표시 컴포넌트
 * 응모 잠금 상태를 시각적으로 표시합니다.
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface LockStatusProps {
  isLocked: boolean;
  lockedReason?: string;
  lockedTime?: Date;
  onUnlock?: () => void;
  canUnlock?: boolean;
}

export function LockStatus({
  isLocked,
  lockedReason,
  lockedTime,
  onUnlock,
  canUnlock,
}: LockStatusProps) {
  if (!isLocked) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-red-900/30 to-red-800/30 border-red-600/50 p-4 mb-4">
      <div className="flex items-start gap-4">
        <div className="text-3xl">🔒</div>
        <div className="flex-1">
          <h3 className="text-red-400 font-bold mb-1">응모가 잠금됨</h3>
          <p className="text-red-300 text-sm mb-2">
            {lockedReason || '응모 마감 시간이 지났습니다.'}
          </p>
          {lockedTime && (
            <p className="text-red-400 text-xs">
              잠금 시간: {new Date(lockedTime).toLocaleString('ko-KR')}
            </p>
          )}
        </div>
        {canUnlock && onUnlock && (
          <Button
            onClick={onUnlock}
            variant="outline"
            className="border-red-600 text-red-400 hover:bg-red-500/20"
          >
            잠금 해제
          </Button>
        )}
      </div>
    </Card>
  );
}
