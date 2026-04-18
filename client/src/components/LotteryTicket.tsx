/**
 * Lottery Ticket - 응모권 카드 컴포넌트
 * 응모권 정보를 카드 형식으로 표시합니다.
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface LotteryTicketData {
  id: number;
  numbers: number[];
  status: 'pending' | 'confirmed' | 'drawn' | 'won' | 'lost';
  walletAddress?: string;
  createdAt: Date;
  updatedAt?: Date;
  depositAmount?: number;
  drawDate?: Date;
  winAmount?: number;
}

interface LotteryTicketProps {
  ticket: LotteryTicketData;
  onCancel?: (id: number) => Promise<void>;
  onView?: (id: number) => void;
}

export function LotteryTicket({ ticket, onCancel, onView }: LotteryTicketProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // 상태별 배지 색상
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    drawn: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    won: 'bg-green-500/20 text-green-400 border-green-500/30',
    lost: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  // 상태별 한글 텍스트
  const statusTexts: Record<string, string> = {
    pending: '응모 대기',
    confirmed: '응모 확정',
    drawn: '추첨 완료',
    won: '당첨',
    lost: '낙첨',
  };

  // 상태별 아이콘
  const statusIcons: Record<string, string> = {
    pending: '⏳',
    confirmed: '✅',
    drawn: '🎰',
    won: '🎉',
    lost: '❌',
  };

  /**
   * 응모 취소
   */
  const handleCancel = async () => {
    if (!onCancel) return;

    if (!window.confirm('이 응모권을 취소하시겠습니까?')) {
      return;
    }

    setIsCanceling(true);
    try {
      await onCancel(ticket.id);
      alert('응모권이 취소되었습니다.');
    } catch (error) {
      console.error('응모권 취소 중 오류:', error);
      alert('응모권 취소 중 오류가 발생했습니다.');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden">
        {/* 상태 표시 바 */}
        <div className={`h-1 bg-gradient-to-r ${
          ticket.status === 'pending' ? 'from-yellow-500 to-orange-500' :
          ticket.status === 'confirmed' ? 'from-blue-500 to-cyan-500' :
          ticket.status === 'drawn' ? 'from-purple-500 to-pink-500' :
          ticket.status === 'won' ? 'from-green-500 to-emerald-500' :
          'from-red-500 to-rose-500'
        }`} />

        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-sm">응모권 #{ticket.id}</p>
              <p className="text-slate-300 text-xs mt-1">
                {new Date(ticket.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <Badge className={`${statusColors[ticket.status]} border`}>
              {statusIcons[ticket.status]} {statusTexts[ticket.status]}
            </Badge>
          </div>

          {/* 번호 표시 */}
          <div className="mb-6">
            <p className="text-slate-400 text-xs mb-2">선택 번호</p>
            <div className="flex flex-wrap gap-2">
              {ticket.numbers.map((num) => (
                <div
                  key={num}
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold text-sm"
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          {/* 입금 정보 (있을 경우) */}
          {ticket.depositAmount && (
            <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
              <p className="text-slate-400 text-xs">입금액</p>
              <p className="text-cyan-400 font-bold">{ticket.depositAmount} ETH</p>
            </div>
          )}

          {/* 당첨금 정보 (있을 경우) */}
          {ticket.winAmount && (
            <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <p className="text-green-400 text-xs">당첨금</p>
              <p className="text-green-400 font-bold text-lg">{ticket.winAmount} ETH</p>
            </div>
          )}

          {/* 지갑 주소 (있을 경우) */}
          {ticket.walletAddress && (
            <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
              <p className="text-slate-400 text-xs">지갑 주소</p>
              <p className="text-slate-300 text-xs font-mono truncate">
                {ticket.walletAddress}
              </p>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowDetails(true);
                onView?.(ticket.id);
              }}
              variant="outline"
              className="flex-1"
            >
              상세 보기
            </Button>
            {ticket.status === 'pending' && onCancel && (
              <Button
                onClick={handleCancel}
                disabled={isCanceling}
                variant="destructive"
                className="flex-1"
              >
                {isCanceling ? '취소 중...' : '취소'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 상세 정보 다이얼로그 */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">응모권 상세 정보</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">응모권 ID</p>
                <p className="text-white font-bold">#{ticket.id}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">상태</p>
                <p className="text-cyan-400 font-bold">
                  {statusIcons[ticket.status]} {statusTexts[ticket.status]}
                </p>
              </div>
            </div>

            {/* 번호 */}
            <div>
              <p className="text-slate-400 text-sm mb-2">선택 번호</p>
              <div className="flex flex-wrap gap-2">
                {ticket.numbers.map((num) => (
                  <div
                    key={num}
                    className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {/* 날짜 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">응모일</p>
                <p className="text-slate-300 text-sm">
                  {new Date(ticket.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
              {ticket.drawDate && (
                <div>
                  <p className="text-slate-400 text-sm">추첨일</p>
                  <p className="text-slate-300 text-sm">
                    {new Date(ticket.drawDate).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              )}
            </div>

            {/* 금액 정보 */}
            {ticket.depositAmount && (
              <div>
                <p className="text-slate-400 text-sm">입금액</p>
                <p className="text-cyan-400 font-bold text-lg">
                  {ticket.depositAmount} ETH
                </p>
              </div>
            )}

            {ticket.winAmount && (
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                <p className="text-green-400 text-sm">당첨금</p>
                <p className="text-green-400 font-bold text-2xl">
                  {ticket.winAmount} ETH
                </p>
              </div>
            )}

            {/* 지갑 주소 */}
            {ticket.walletAddress && (
              <div>
                <p className="text-slate-400 text-sm">지갑 주소</p>
                <p className="text-slate-300 text-xs font-mono break-all">
                  {ticket.walletAddress}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
