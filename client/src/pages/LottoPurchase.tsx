/**
 * Lotto Purchase - 로또 구매 페이지
 * 번호 입력, 자동 선택, 구매 기능 + Web3 지갑 연동
 */

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { WalletConnect, WalletStatus } from '@/components/WalletConnect';
import { useAccount, useBalance } from 'wagmi';
import { Loader2, CheckCircle2, XCircle, Wallet } from 'lucide-react';

export default function LottoPurchase() {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-900/30 border-red-600/50 p-6">
            <h1 className="text-2xl font-bold text-red-400 mb-2">로그인 필요</h1>
            <p className="text-red-300">로또를 구매하려면 로그인해주세요.</p>
          </Card>
        </div>
      </div>
    );
  }

  // 번호 선택 토글
  const toggleNumber = useCallback((num: number) => {
    setSelectedNumbers((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num);
      } else if (prev.length < 6) {
        return [...prev, num].sort((a, b) => a - b);
      }
      return prev;
    });
  }, []);

  // 자동 선택
  const autoSelect = useCallback(() => {
    const numbers: number[] = [];
    while (numbers.length < 6) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    setSelectedNumbers(numbers.sort((a, b) => a - b));
  }, []);

  // 모두 해제
  const clearAll = useCallback(() => {
    setSelectedNumbers([]);
  }, []);

  // 구매 가격 계산 (1만원 = 1응모권)
  const pricePerTicket = 10000; // 1만원
  const totalPrice = quantity * pricePerTicket;
  const equivalentWLD = (totalPrice / 10000).toFixed(2); // 월드코인 환산

  /**
   * 월드코인 결제 처리
   */
  const handleWorldcoinPayment = async () => {
    if (!isConnected || !address) {
      setPaymentError('지갑을 먼저 연결해주세요');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setPaymentError(null);

    try {
      // 실제 구현에서는 tRPC 호출
      console.log('💳 월드코인 결제 처리:', {
        amount: totalPrice.toString(),
        userAddress: address,
        ticketNumbers: selectedNumbers,
        quantity,
      });

      // 시뮬레이션: 2초 대기 후 성공
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setPaymentStatus('success');
      setTimeout(() => {
        setShowConfirm(false);
        setSelectedNumbers([]);
        setQuantity(1);
        setPaymentStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('결제 실패:', error);
      setPaymentStatus('error');
      setPaymentError('결제 처리 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 일반 결제 처리
   */
  const handleRegularPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');
    setPaymentError(null);

    try {
      console.log('💳 일반 결제 처리:', {
        amount: totalPrice,
        ticketNumbers: selectedNumbers,
        quantity,
      });

      // 시뮬레이션: 1.5초 대기 후 성공
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setPaymentStatus('success');
      setTimeout(() => {
        setShowConfirm(false);
        setSelectedNumbers([]);
        setQuantity(1);
        setPaymentStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('결제 실패:', error);
      setPaymentStatus('error');
      setPaymentError('결제 처리 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎰 로또 구매</h1>
          <p className="text-slate-300">번호를 선택하고 로또를 구매하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 번호 선택 영역 */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 p-6 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                번호 선택 ({selectedNumbers.length}/6)
              </h2>

              {/* 번호 그리드 */}
              <div className="grid grid-cols-9 gap-2 mb-6">
                {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => toggleNumber(num)}
                    className={`aspect-square rounded-lg font-bold text-sm transition-all ${
                      selectedNumbers.includes(num)
                        ? 'bg-yellow-500 text-black scale-110 shadow-lg'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* 선택된 번호 표시 */}
              {selectedNumbers.length > 0 && (
                <div className="bg-slate-700/50 p-4 rounded mb-6 border border-slate-600">
                  <p className="text-slate-300 text-sm mb-2">선택된 번호:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedNumbers.map((num) => (
                      <span
                        key={num}
                        className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold text-sm"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={autoSelect}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  🎲 자동선택
                </Button>
                <Button
                  onClick={clearAll}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  ✕ 모두해제
                </Button>
                <Button
                  disabled={selectedNumbers.length !== 6}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-50"
                  onClick={() => setShowConfirm(true)}
                >
                  ✓ 확인
                </Button>
              </div>
            </Card>

            {/* 추가 구매 설정 */}
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">📋 구매 설정</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-2">구매 장수</label>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4"
                    >
                      −
                    </Button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-center font-bold"
                    />
                    <Button
                      onClick={() => setQuantity(quantity + 1)}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">지갑 주소 (선택)</label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* 결제 요약 & 지갑 연동 */}
          <div>
            {/* 지갑 연동 카드 */}
            <div className="mb-6">
              <WalletConnect />
            </div>

            {/* 결제 요약 */}
            <Card className="bg-gradient-to-b from-yellow-600/20 to-yellow-700/20 border-yellow-600/30 p-6 sticky top-4">
              <h3 className="text-xl font-bold text-white mb-4">💳 결제 요약</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-300">1장 가격</span>
                  <span className="text-white font-bold">₩{pricePerTicket.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">구매 장수</span>
                  <span className="text-white font-bold">{quantity}장</span>
                </div>
                <div className="border-t border-slate-600 pt-3 flex justify-between">
                  <span className="text-white font-bold">총 금액</span>
                  <span className="text-yellow-400 font-bold text-2xl">₩{totalPrice.toLocaleString()}</span>
                </div>

                {/* 월드코인 환산 */}
                <div className="bg-slate-700/30 p-3 rounded border border-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">월드코인 환산</span>
                    <span className="text-blue-400 font-bold">{equivalentWLD} WLD</span>
                  </div>
                </div>
              </div>

              {/* 결제 방법 선택 */}
              <div className="space-y-2">
                <Button
                  disabled={selectedNumbers.length !== 6 || !isConnected}
                  onClick={() => setShowConfirm(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  💳 월드코인 결제
                </Button>

                <Button
                  disabled={selectedNumbers.length !== 6}
                  onClick={() => setShowConfirm(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 rounded-lg disabled:opacity-50"
                >
                  🛒 일반 결제
                </Button>
              </div>

              {!isConnected && (
                <div className="mt-4 p-3 bg-orange-900/30 border border-orange-600/50 rounded text-orange-300 text-xs">
                  💡 월드코인 결제를 위해 지갑을 연결해주세요
                </div>
              )}

              <div className="mt-4 text-xs text-slate-400 space-y-1">
                <p>• 번호는 6개를 선택해야 합니다</p>
                <p>• 1장당 ₩{pricePerTicket.toLocaleString()}입니다</p>
                <p>• 지갑 주소는 선택사항입니다</p>
              </div>
            </Card>
          </div>
        </div>

        {/* 구매 확인 다이얼로그 */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">
                {paymentStatus === 'success' ? '✅ 구매 완료' : '구매 확인'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {paymentStatus === 'success' && (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-3" />
                  <p className="text-green-400 font-bold text-lg mb-2">구매가 완료되었습니다!</p>
                  <p className="text-slate-300 text-sm">응모권이 발급되었습니다.</p>
                </div>
              )}

              {paymentStatus === 'error' && (
                <div className="text-center py-6">
                  <XCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
                  <p className="text-red-400 font-bold text-lg mb-2">결제 실패</p>
                  <p className="text-slate-300 text-sm">{paymentError}</p>
                </div>
              )}

              {paymentStatus === 'idle' && (
                <>
                  <div className="bg-slate-700/30 p-4 rounded">
                    <p className="text-slate-300 text-sm mb-2">선택된 번호:</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedNumbers.map((num) => (
                        <span
                          key={num}
                          className="bg-yellow-500 text-black px-3 py-1 rounded-full font-bold"
                        >
                          {num}
                        </span>
                      ))}
                    </div>

                    <div className="border-t border-slate-600 pt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-300">구매 장수</span>
                        <span className="text-white font-bold">{quantity}장</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">총 금액</span>
                        <span className="text-yellow-400 font-bold">₩{totalPrice.toLocaleString()}</span>
                      </div>
                      {isConnected && (
                        <div className="flex justify-between">
                          <span className="text-slate-300">결제 방법</span>
                          <span className="text-blue-400 font-bold">월드코인</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setShowConfirm(false)}
                      disabled={isProcessing}
                      className="bg-slate-700 hover:bg-slate-600 text-white font-bold"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={isConnected ? handleWorldcoinPayment : handleRegularPayment}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          처리 중...
                        </>
                      ) : (
                        '구매 완료'
                      )}
                    </Button>
                  </div>
                </>
              )}

              {paymentStatus !== 'idle' && (
                <Button
                  onClick={() => {
                    setShowConfirm(false);
                    setPaymentStatus('idle');
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold"
                >
                  닫기
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
