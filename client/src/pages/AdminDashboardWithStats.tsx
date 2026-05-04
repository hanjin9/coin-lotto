import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, TrendingUp } from 'lucide-react';
import PaymentStatistics from './PaymentStatistics';

/**
 * 통합 관리자 대시보드 (추첨 관리 + 통계)
 */

const AdminDashboardWithStats: React.FC = () => {
  const [activeTab, setActiveTab] = useState('draw');
  const [winningNumbers, setWinningNumbers] = useState<number[]>([]);
  const [prizes, setPrizes] = useState({
    first: 1000000,
    second: 100000,
    third: 10000,
    fourth: 1000,
  });

  // 당첨번호 입력 핸들러
  const handleNumberInput = (index: number, value: string) => {
    const num = parseInt(value) || 0;
    const newNumbers = [...winningNumbers];
    newNumbers[index] = num;
    setWinningNumbers(newNumbers);
  };

  // 추첨 실행
  const handleExecuteDraw = () => {
    if (winningNumbers.length !== 6) {
      alert('6개의 번호를 모두 입력해주세요.');
      return;
    }

    console.log('🎰 추첨 실행:', {
      winningNumbers,
      prizes,
    });

    alert('추첨이 완료되었습니다!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">관리자 대시보드</h1>
          <p className="text-gray-400">로또 추첨 관리 및 통계 분석</p>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700 mb-6">
            <TabsTrigger
              value="draw"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              추첨 관리
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              통계 분석
            </TabsTrigger>
          </TabsList>

          {/* 추첨 관리 탭 */}
          <TabsContent value="draw" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">당첨번호 입력</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 당첨번호 입력 */}
                <div>
                  <label className="text-sm text-gray-300 mb-4 block">
                    당첨번호 (1~45, 6개)
                  </label>
                  <div className="grid grid-cols-6 gap-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <Input
                        key={idx}
                        type="number"
                        min="1"
                        max="45"
                        placeholder={`${idx + 1}`}
                        value={winningNumbers[idx] || ''}
                        onChange={(e) => handleNumberInput(idx, e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white text-center text-lg font-bold"
                      />
                    ))}
                  </div>
                </div>

                {/* 상금 설정 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      1등 상금
                    </label>
                    <Input
                      type="number"
                      value={prizes.first}
                      onChange={(e) =>
                        setPrizes({
                          ...prizes,
                          first: parseInt(e.target.value) || 0,
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      2등 상금
                    </label>
                    <Input
                      type="number"
                      value={prizes.second}
                      onChange={(e) =>
                        setPrizes({
                          ...prizes,
                          second: parseInt(e.target.value) || 0,
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      3등 상금
                    </label>
                    <Input
                      type="number"
                      value={prizes.third}
                      onChange={(e) =>
                        setPrizes({
                          ...prizes,
                          third: parseInt(e.target.value) || 0,
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      4등 상금
                    </label>
                    <Input
                      type="number"
                      value={prizes.fourth}
                      onChange={(e) =>
                        setPrizes({
                          ...prizes,
                          fourth: parseInt(e.target.value) || 0,
                        })
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                {/* 추첨 실행 버튼 */}
                <Button
                  onClick={handleExecuteDraw}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 text-lg"
                >
                  🎰 추첨 실행
                </Button>
              </CardContent>
            </Card>

            {/* 기존 추첨 관리 UI (생략 - 기존 AdminDashboard 내용) */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">최근 추첨 결과</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">추첨 결과가 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 통계 분석 탭 */}
          <TabsContent value="stats" className="w-full">
            <PaymentStatistics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboardWithStats;
