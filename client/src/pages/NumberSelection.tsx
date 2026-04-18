/**
 * Number Selection - 번호 선택 UI
 * 사용자가 로또 번호를 선택하고 응모하는 페이지
 */

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

interface SelectedNumbers {
  [key: number]: boolean;
}

export default function NumberSelection() {
  const { user } = useAuth();
  const [selectedNumbers, setSelectedNumbers] = useState<SelectedNumbers>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // tRPC 뮤테이션
  const submitLottery = trpc.lottery.submit.useMutation();

  // 선택된 번호 개수
  const selectedCount = useMemo(
    () => Object.values(selectedNumbers).filter(Boolean).length,
    [selectedNumbers]
  );

  // 선택된 번호 배열
  const selectedNumbersArray = useMemo(
    () => Object.entries(selectedNumbers)
      .filter(([_, selected]) => selected)
      .map(([num]) => parseInt(num)),
    [selectedNumbers]
  );

  /**
   * 번호 토글
   */
  const toggleNumber = useCallback((num: number) => {
    setSelectedNumbers((prev) => ({
      ...prev,
      [num]: !prev[num],
    }));
  }, []);

  /**
   * 모두 선택
   */
  const selectAll = useCallback(() => {
    const allNumbers: SelectedNumbers = {};
    for (let i = 1; i <= 45; i++) {
      allNumbers[i] = true;
    }
    setSelectedNumbers(allNumbers);
  }, []);

  /**
   * 모두 해제
   */
  const clearAll = useCallback(() => {
    setSelectedNumbers({});
  }, []);

  /**
   * 자동 선택 (6개 랜덤)
   */
  const autoSelect = useCallback(() => {
    const numbers: number[] = [];
    while (numbers.length < 6) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }

    const newSelection: SelectedNumbers = {};
    numbers.forEach((num) => {
      newSelection[num] = true;
    });
    setSelectedNumbers(newSelection);
  }, []);

  /**
   * 응모 제출
   */
  const handleSubmit = useCallback(async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (selectedNumbersArray.length !== 6) {
      alert('정확히 6개의 번호를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitLottery.mutateAsync({
        numbers: selectedNumbersArray,
      });

      if (result.success) {
        alert('응모가 완료되었습니다!');
        clearAll();
        setShowConfirm(false);
      } else {
        alert('응모 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('응모 중 오류:', error);
      alert('응모 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, selectedNumbersArray, submitLottery, clearAll]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎰 번호 선택</h1>
          <p className="text-slate-300">6개의 번호를 선택하고 응모하세요</p>
        </div>

        {/* 선택 상태 */}
        <Card className="bg-slate-800 border-slate-700 mb-6 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-slate-300 text-sm">선택된 번호</p>
              <p className="text-3xl font-bold text-white">
                {selectedCount} / 6
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-300 text-sm">선택된 번호</p>
              <p className="text-lg font-mono text-cyan-400">
                {selectedNumbersArray.length > 0
                  ? selectedNumbersArray.sort((a, b) => a - b).join(', ')
                  : '없음'}
              </p>
            </div>
          </div>

          {/* 컨트롤 버튼 */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={autoSelect}
              variant="outline"
              className="flex-1 min-w-[120px]"
            >
              🎲 자동 선택
            </Button>
            <Button
              onClick={selectAll}
              variant="outline"
              className="flex-1 min-w-[120px]"
            >
              ✓ 모두 선택
            </Button>
            <Button
              onClick={clearAll}
              variant="outline"
              className="flex-1 min-w-[120px]"
            >
              ✕ 모두 해제
            </Button>
          </div>
        </Card>

        {/* 번호 그리드 */}
        <Card className="bg-slate-800 border-slate-700 mb-6 p-6">
          <div className="grid grid-cols-9 gap-2 sm:grid-cols-10 md:grid-cols-15">
            {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                className={`
                  aspect-square rounded-lg font-bold text-sm
                  transition-all duration-200
                  ${
                    selectedNumbers[num]
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50 scale-105'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }
                `}
              >
                {num}
              </button>
            ))}
          </div>
        </Card>

        {/* 응모 버튼 */}
        <div className="flex gap-4">
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={selectedCount !== 6}
            className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
          >
            🎯 응모하기
          </Button>
        </div>

        {/* 확인 다이얼로그 */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">응모 확인</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-300 text-sm mb-2">선택된 번호</p>
                <p className="text-2xl font-bold text-cyan-400 font-mono">
                  {selectedNumbersArray.sort((a, b) => a - b).join(' - ')}
                </p>
              </div>

              <p className="text-slate-300 text-center">
                위 번호로 응모하시겠습니까?
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowConfirm(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '응모 중...' : '확인'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 안내 메시지 */}
        {selectedCount !== 6 && (
          <div className="mt-6 p-4 bg-amber-900/30 border border-amber-700 rounded-lg text-amber-200 text-center">
            <p>정확히 6개의 번호를 선택해주세요</p>
            <p className="text-sm mt-1">현재: {selectedCount}개 선택됨</p>
          </div>
        )}
      </div>
    </div>
  );
}
