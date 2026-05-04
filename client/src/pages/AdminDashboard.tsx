/**
 * Admin Dashboard - 관리자 페이지
 * 추첨 관리, 당첨자 확인, 통계 조회
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface DrawFormData {
  numbers: number[];
  totalPrize: string;
  prizeDistribution: {
    rank1: string;
    rank2: string;
    rank3: string;
    rank4: string;
  };
}

interface Winner {
  id: number;
  ticketId: number;
  userId: number;
  matchedNumbers: number;
  prizeAmount: string;
  rank: number;
  claimedAt: Date | null;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [showDrawDialog, setShowDrawDialog] = useState(false);
  const [showWinnersDialog, setShowWinnersDialog] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [drawFormData, setDrawFormData] = useState<DrawFormData>({
    numbers: [],
    totalPrize: '0',
    prizeDistribution: {
      rank1: '0',
      rank2: '0',
      rank3: '0',
      rank4: '0',
    },
  });
  const [winners, setWinners] = useState<Winner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 권한 확인
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-900/30 border-red-600/50 p-6">
            <h1 className="text-2xl font-bold text-red-400 mb-2">접근 거부</h1>
            <p className="text-red-300">관리자만 접근할 수 있습니다.</p>
          </Card>
        </div>
      </div>
    );
  }

  /**
   * 당첨번호 입력 처리
   */
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (!input) {
      setDrawFormData({ ...drawFormData, numbers: [] });
      return;
    }

    const numbers = input
      .split(',')
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 45);

    setDrawFormData({ ...drawFormData, numbers });
  };

  /**
   * 당첨번호 유효성 검사
   */
  const validateNumbers = (): boolean => {
    if (drawFormData.numbers.length !== 6) {
      setError('당첨번호는 정확히 6개여야 합니다');
      return false;
    }

    if (new Set(drawFormData.numbers).size !== 6) {
      setError('당첨번호에 중복이 있습니다');
      return false;
    }

    return true;
  };

  /**
   * 추첨 실행
   */
  const handleExecuteDraw = async () => {
    setError(null);
    setSuccess(null);

    if (!validateNumbers()) {
      return;
    }

    setIsLoading(true);

    try {
      // 실제 구현에서는 tRPC 호출
      console.log('🎰 추첨 실행:', drawFormData);

      // 시뮬레이션: 당첨자 생성
      const simulatedWinners: Winner[] = [
        {
          id: 1,
          ticketId: 101,
          userId: 1,
          matchedNumbers: 6,
          prizeAmount: '50000000',
          rank: 1,
          claimedAt: null,
        },
        {
          id: 2,
          ticketId: 102,
          userId: 2,
          matchedNumbers: 5,
          prizeAmount: '5000000',
          rank: 2,
          claimedAt: null,
        },
        {
          id: 3,
          ticketId: 103,
          userId: 3,
          matchedNumbers: 4,
          prizeAmount: '500000',
          rank: 3,
          claimedAt: null,
        },
      ];

      setWinners(simulatedWinners);
      setSuccess(`✅ 추첨 완료! 총 ${simulatedWinners.length}명의 당첨자가 선정되었습니다.`);
      setShowDrawDialog(false);
      setDrawFormData({
        numbers: [],
        totalPrize: '0',
        prizeDistribution: {
          rank1: '0',
          rank2: '0',
          rank3: '0',
          rank4: '0',
        },
      });

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError('추첨 실행 중 오류가 발생했습니다');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 상금 청구 처리
   */
  const handleClaimPrize = async (winnerId: number) => {
    setIsLoading(true);

    try {
      // 실제 구현에서는 tRPC 호출
      console.log('💳 상금 청구:', winnerId);

      setWinners(
        winners.map((w) =>
          w.id === winnerId
            ? { ...w, claimedAt: new Date() }
            : w
        )
      );

      setSuccess('✅ 상금이 청구되었습니다');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('상금 청구 중 오류가 발생했습니다');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ 관리자 대시보드</h1>
          <p className="text-slate-300">로또 추첨 관리 및 통계</p>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-600/50 rounded-lg flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-600/50 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-green-300">{success}</span>
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">전체 응모권</div>
            <div className="text-3xl font-bold text-white">1,234</div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">확정된 응모권</div>
            <div className="text-3xl font-bold text-green-400">987</div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">총 입금액</div>
            <div className="text-3xl font-bold text-blue-400">₩98.7M</div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">당첨자</div>
            <div className="text-3xl font-bold text-yellow-400">{winners.length}</div>
          </Card>
        </div>

        {/* 관리 버튼 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => {
              setSelectedDraw(null);
              setShowDrawDialog(true);
            }}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-6 rounded-lg"
          >
            🎰 추첨 실행
          </Button>

          <Button
            onClick={() => setShowWinnersDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-6 rounded-lg"
          >
            📊 당첨자 확인 ({winners.length})
          </Button>

          <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-6 rounded-lg">
            🔗 블록체인 기록
          </Button>
        </div>

        {/* 최근 추첨 목록 */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">📋 최근 추첨 기록</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300">회차</th>
                  <th className="text-left py-3 px-4 text-slate-300">추첨일시</th>
                  <th className="text-left py-3 px-4 text-slate-300">당첨번호</th>
                  <th className="text-left py-3 px-4 text-slate-300">당첨자</th>
                  <th className="text-left py-3 px-4 text-slate-300">상태</th>
                  <th className="text-left py-3 px-4 text-slate-300">액션</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white font-bold">#{i}</td>
                    <td className="py-3 px-4 text-slate-300">2026-04-{15 + i}</td>
                    <td className="py-3 px-4 text-slate-300">1, 5, 10, 15, 20, 25</td>
                    <td className="py-3 px-4 text-yellow-400 font-bold">{i * 10}</td>
                    <td className="py-3 px-4">
                      <span className="bg-green-600/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                        완료
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() => {
                          setSelectedDraw(i);
                          setShowWinnersDialog(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                      >
                        상세보기
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 추첨 실행 다이얼로그 */}
        <Dialog open={showDrawDialog && !selectedDraw} onOpenChange={setShowDrawDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">🎰 추첨 실행</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* 당첨번호 입력 */}
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2">
                  당첨번호 입력 (6개, 1~45)
                </label>
                <input
                  type="text"
                  placeholder="예: 1,5,10,15,20,25"
                  value={drawFormData.numbers.join(',')}
                  onChange={handleNumberInput}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none"
                />
                <div className="mt-2 text-xs text-slate-400">
                  입력된 번호: {drawFormData.numbers.length > 0 ? drawFormData.numbers.join(', ') : '없음'}
                </div>
              </div>

              {/* 상금 배분 설정 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">
                    1등 상금 (6개 일치)
                  </label>
                  <input
                    type="number"
                    placeholder="₩"
                    value={drawFormData.prizeDistribution.rank1}
                    onChange={(e) =>
                      setDrawFormData({
                        ...drawFormData,
                        prizeDistribution: {
                          ...drawFormData.prizeDistribution,
                          rank1: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">
                    2등 상금 (5개 일치)
                  </label>
                  <input
                    type="number"
                    placeholder="₩"
                    value={drawFormData.prizeDistribution.rank2}
                    onChange={(e) =>
                      setDrawFormData({
                        ...drawFormData,
                        prizeDistribution: {
                          ...drawFormData.prizeDistribution,
                          rank2: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">
                    3등 상금 (4개 일치)
                  </label>
                  <input
                    type="number"
                    placeholder="₩"
                    value={drawFormData.prizeDistribution.rank3}
                    onChange={(e) =>
                      setDrawFormData({
                        ...drawFormData,
                        prizeDistribution: {
                          ...drawFormData.prizeDistribution,
                          rank3: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-2">
                    4등 상금 (3개 일치)
                  </label>
                  <input
                    type="number"
                    placeholder="₩"
                    value={drawFormData.prizeDistribution.rank4}
                    onChange={(e) =>
                      setDrawFormData({
                        ...drawFormData,
                        prizeDistribution: {
                          ...drawFormData.prizeDistribution,
                          rank4: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 추첨 실행 버튼 */}
              <Button
                onClick={handleExecuteDraw}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    추첨 진행 중...
                  </>
                ) : (
                  '🎰 추첨 실행'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* 당첨자 목록 다이얼로그 */}
        <Dialog open={showWinnersDialog} onOpenChange={setShowWinnersDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                📊 당첨자 목록 {selectedDraw && `(#${selectedDraw})`}
              </DialogTitle>
            </DialogHeader>

            {winners.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">당첨자가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 당첨자 요약 */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="bg-slate-700/30 border-slate-600 p-3">
                    <div className="text-slate-400 text-xs mb-1">총 당첨자</div>
                    <div className="text-2xl font-bold text-white">{winners.length}</div>
                  </Card>
                  <Card className="bg-slate-700/30 border-slate-600 p-3">
                    <div className="text-slate-400 text-xs mb-1">1등</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {winners.filter((w) => w.rank === 1).length}
                    </div>
                  </Card>
                  <Card className="bg-slate-700/30 border-slate-600 p-3">
                    <div className="text-slate-400 text-xs mb-1">2등</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {winners.filter((w) => w.rank === 2).length}
                    </div>
                  </Card>
                  <Card className="bg-slate-700/30 border-slate-600 p-3">
                    <div className="text-slate-400 text-xs mb-1">3등</div>
                    <div className="text-2xl font-bold text-green-400">
                      {winners.filter((w) => w.rank === 3).length}
                    </div>
                  </Card>
                </div>

                {/* 당첨자 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-300">등급</th>
                        <th className="text-left py-3 px-4 text-slate-300">사용자 ID</th>
                        <th className="text-left py-3 px-4 text-slate-300">일치 번호</th>
                        <th className="text-left py-3 px-4 text-slate-300">상금</th>
                        <th className="text-left py-3 px-4 text-slate-300">청구 상태</th>
                        <th className="text-left py-3 px-4 text-slate-300">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winners.map((winner) => (
                        <tr key={winner.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold ${
                                winner.rank === 1
                                  ? 'bg-yellow-600/30 text-yellow-400'
                                  : winner.rank === 2
                                    ? 'bg-blue-600/30 text-blue-400'
                                    : 'bg-green-600/30 text-green-400'
                              }`}
                            >
                              {winner.rank}등
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white font-bold">#{winner.userId}</td>
                          <td className="py-3 px-4 text-slate-300">{winner.matchedNumbers}개</td>
                          <td className="py-3 px-4 text-yellow-400 font-bold">
                            ₩{parseInt(winner.prizeAmount).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {winner.claimedAt ? (
                              <span className="text-green-400 text-xs font-bold">✓ 청구됨</span>
                            ) : (
                              <span className="text-orange-400 text-xs font-bold">대기 중</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {!winner.claimedAt && (
                              <Button
                                onClick={() => handleClaimPrize(winner.id)}
                                disabled={isLoading}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                              >
                                청구
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
