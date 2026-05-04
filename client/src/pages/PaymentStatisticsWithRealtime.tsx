import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, RefreshCw, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * 통계 대시보드 (실시간 데이터 연동)
 */

const PaymentStatisticsWithRealtime: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5초

  // tRPC 쿼리
  const paymentStats = trpc.statistics.getPaymentStats.useQuery({
    period: 'daily',
  });

  const paymentTrend = trpc.statistics.getPaymentTrend.useQuery({
    period: 'daily',
    days: 7,
  });

  const paymentMethods = trpc.statistics.getPaymentMethodStats.useQuery();
  const retryAnalysis = trpc.statistics.getRetryAnalysis.useQuery();
  const realTimeStats = trpc.statistics.getRealTimeStats.useQuery();

  // 실시간 업데이트 (폴링)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      realTimeStats.refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, realTimeStats]);

  // 색상 정의
  const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

  // 데이터 로딩 상태
  if (
    paymentStats.isLoading ||
    paymentTrend.isLoading ||
    paymentMethods.isLoading
  ) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">통계 데이터를 로드 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">결제 통계 분석</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
            className={`${
              autoRefresh
                ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                : 'border-gray-600 text-gray-400'
            }`}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {autoRefresh ? '자동 갱신 중' : '자동 갱신 중지'}
          </Button>
          <Button
            onClick={() => realTimeStats.refetch()}
            variant="outline"
            className="border-gray-600 text-gray-400 hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 실시간 통계 카드 */}
      {realTimeStats.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">
                진행 중인 거래
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-400">
                {realTimeStats.data.activeTransactions}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">
                오늘 성공
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">
                {realTimeStats.data.successfulToday}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">
                오늘 실패
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-400">
                {realTimeStats.data.failedToday}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">
                오늘 매출
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-400">
                ₩{(realTimeStats.data.totalAmountToday / 1000000).toFixed(1)}M
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
          >
            개요
          </TabsTrigger>
          <TabsTrigger
            value="trend"
            className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
          >
            추이
          </TabsTrigger>
          <TabsTrigger
            value="methods"
            className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
          >
            결제 방법
          </TabsTrigger>
          <TabsTrigger
            value="retry"
            className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
          >
            재시도 분석
          </TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          {paymentStats.data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">성공률</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-green-400 mb-2">
                    {paymentStats.data.successRate}%
                  </p>
                  <p className="text-sm text-gray-400">
                    {paymentStats.data.successfulTransactions} / 성공
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">실패율</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-red-400 mb-2">
                    {paymentStats.data.failureRate}%
                  </p>
                  <p className="text-sm text-gray-400">
                    {paymentStats.data.failedTransactions} / 실패
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">환불율</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-orange-400 mb-2">
                    {paymentStats.data.refundRate}%
                  </p>
                  <p className="text-sm text-gray-400">
                    {paymentStats.data.refundedTransactions} / 환불
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* 추이 탭 */}
        <TabsContent value="trend" className="space-y-4">
          {paymentTrend.data && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">시간대별 결제 추이</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={paymentTrend.data.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="date" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="successful"
                      stroke="#10b981"
                      name="성공"
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="#ef4444"
                      name="실패"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 결제 방법 탭 */}
        <TabsContent value="methods" className="space-y-4">
          {paymentMethods.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    결제 방법별 분포
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethods.data.methods}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {paymentMethods.data.methods.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    결제 방법별 상세
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paymentMethods.data.methods.map((method: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: COLORS[idx % COLORS.length],
                            }}
                          ></div>
                          <span className="text-gray-300">{method.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">
                            {method.count}건
                          </p>
                          <p className="text-xs text-gray-400">
                            {method.percentage}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* 재시도 분석 탭 */}
        <TabsContent value="retry" className="space-y-4">
          {retryAnalysis.data && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">재시도 횟수별 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={retryAnalysis.data.retryStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis
                      dataKey="description"
                      stroke="#999"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis stroke="#999" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                      }}
                    />
                    <Bar dataKey="successCount" fill="#FFD700" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                  <p className="text-sm text-gray-300 mb-2">
                    <TrendingUp className="w-4 h-4 inline mr-2 text-green-400" />
                    재시도를 통한 복구율:{' '}
                    <span className="font-bold text-green-400">
                      {retryAnalysis.data.recoveryRate}%
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {retryAnalysis.data.totalRecovered}건 복구됨
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 데이터 내보내기 */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => {
            // CSV 내보내기
            console.log('CSV 내보내기');
          }}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <Download className="w-4 h-4 mr-2" />
          CSV 내보내기
        </Button>
      </div>
    </div>
  );
};

export default PaymentStatisticsWithRealtime;
