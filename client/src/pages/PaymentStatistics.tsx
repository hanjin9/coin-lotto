import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';

/**
 * 결제 통계 대시보드
 * 
 * 기능:
 * 1. 성공율/실패율/환불율 차트
 * 2. 재시도 횟수별 분석
 * 3. 시간대별 결제 추이
 * 4. 결제 방법별 통계
 * 5. 일일/주간/월간 필터링
 * 6. 데이터 내보내기
 */

interface PaymentStat {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  successRate: number;
  failureRate: number;
  refundRate: number;
  totalAmount: string;
  totalRefunded: string;
  averageRetries: number;
}

interface TimeSeriesData {
  time: string;
  payments: number;
  success: number;
  failure: number;
}

interface RetryAnalysis {
  retryCount: number;
  count: number;
  successRate: number;
}

interface PaymentMethodStat {
  method: string;
  count: number;
  amount: string;
  percentage: number;
}

const PaymentStatistics: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isLoading, setIsLoading] = useState(false);

  // 시뮬레이션 데이터
  const mockStats: PaymentStat = {
    totalPayments: 1000,
    successfulPayments: 950,
    failedPayments: 30,
    refundedPayments: 20,
    successRate: 95.0,
    failureRate: 3.0,
    refundRate: 2.0,
    totalAmount: '10,000,000',
    totalRefunded: '100,000',
    averageRetries: 0.5,
  };

  const mockTimeSeriesData: TimeSeriesData[] = [
    { time: '00:00', payments: 50, success: 48, failure: 2 },
    { time: '04:00', payments: 45, success: 43, failure: 2 },
    { time: '08:00', payments: 120, success: 114, failure: 6 },
    { time: '12:00', payments: 200, success: 190, failure: 10 },
    { time: '16:00', payments: 250, success: 238, failure: 12 },
    { time: '20:00', payments: 180, success: 171, failure: 9 },
    { time: '23:59', payments: 155, success: 146, failure: 9 },
  ];

  const mockRetryAnalysis: RetryAnalysis[] = [
    { retryCount: 0, count: 950, successRate: 95.0 },
    { retryCount: 1, count: 30, successRate: 60.0 },
    { retryCount: 2, count: 15, successRate: 40.0 },
    { retryCount: 3, count: 5, successRate: 20.0 },
  ];

  const mockPaymentMethods: PaymentMethodStat[] = [
    { method: '월드코인', count: 600, amount: '6,000,000', percentage: 60 },
    { method: '카카오페이', count: 250, amount: '2,500,000', percentage: 25 },
    { method: '토스뱅크', count: 100, amount: '1,000,000', percentage: 10 },
    { method: '기타', count: 50, amount: '500,000', percentage: 5 },
  ];

  // 데이터 내보내기
  const handleExportCSV = () => {
    setIsLoading(true);
    setTimeout(() => {
      const csv = generateCSV();
      downloadCSV(csv, `payment-statistics-${new Date().toISOString()}.csv`);
      setIsLoading(false);
    }, 1000);
  };

  const generateCSV = () => {
    const headers = ['항목', '값'];
    const rows = [
      ['총 결제 건수', mockStats.totalPayments],
      ['성공 건수', mockStats.successfulPayments],
      ['실패 건수', mockStats.failedPayments],
      ['환불 건수', mockStats.refundedPayments],
      ['성공율', `${mockStats.successRate}%`],
      ['실패율', `${mockStats.failureRate}%`],
      ['환불율', `${mockStats.refundRate}%`],
      ['총 결제액', mockStats.totalAmount],
      ['총 환불액', mockStats.totalRefunded],
      ['평균 재시도 횟수', mockStats.averageRetries],
    ];

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csv;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    );
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">결제 통계 대시보드</h1>
          <p className="text-gray-400">실시간 결제 현황 및 분석</p>
        </div>

        {/* 기간 선택 */}
        <div className="mb-6 flex gap-3">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <Button
              key={p}
              onClick={() => setPeriod(p)}
              variant={period === p ? 'default' : 'outline'}
              className={
                period === p
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                  : 'border-gray-600 text-gray-300 hover:bg-slate-800'
              }
            >
              {p === 'daily' ? '일일' : p === 'weekly' ? '주간' : '월간'}
            </Button>
          ))}
          <Button
            onClick={handleExportCSV}
            disabled={isLoading}
            className="ml-auto bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? '내보내기 중...' : 'CSV 내보내기'}
          </Button>
        </div>

        {/* 주요 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* 총 결제액 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                총 결제액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-white">
                  ₩{mockStats.totalAmount}
                </div>
                <DollarSign className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          {/* 성공 건수 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                성공 건수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-400">
                  {mockStats.successfulPayments}
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                성공율: {mockStats.successRate}%
              </p>
            </CardContent>
          </Card>

          {/* 실패 건수 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                실패 건수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-red-400">
                  {mockStats.failedPayments}
                </div>
                <TrendingDown className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                실패율: {mockStats.failureRate}%
              </p>
            </CardContent>
          </Card>

          {/* 환불액 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                환불액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-400">
                  ₩{mockStats.totalRefunded}
                </div>
                <RefreshCw className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                환불율: {mockStats.refundRate}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 시간대별 결제 추이 */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">시간대별 결제 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTimeSeriesData.map((data, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-12 text-sm text-gray-400">{data.time}</div>
                  <div className="flex-1">
                    <div className="flex gap-1 h-8">
                      {/* 성공 */}
                      <div
                        className="bg-green-500 rounded"
                        style={{
                          width: `${(data.success / data.payments) * 100}%`,
                        }}
                      />
                      {/* 실패 */}
                      <div
                        className="bg-red-500 rounded"
                        style={{
                          width: `${(data.failure / data.payments) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-gray-400">
                    {data.payments}건
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 두 개 컬럼 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 재시도 횟수별 분석 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">재시도 횟수별 분석</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRetryAnalysis.map((data, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-400">
                      {data.retryCount === 0
                        ? '첫 시도'
                        : `${data.retryCount}회 재시도`}
                    </div>
                    <div className="flex-1">
                      <div className="bg-slate-700 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full flex items-center justify-center text-xs text-white"
                          style={{ width: `${data.successRate}%` }}
                        >
                          {data.successRate > 20 && `${data.successRate}%`}
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm text-gray-400">
                      {data.count}건
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 결제 방법별 통계 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">결제 방법별 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPaymentMethods.map((method, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-gray-400">
                      {method.method}
                    </div>
                    <div className="flex-1">
                      <div className="bg-slate-700 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full flex items-center justify-center text-xs text-white font-semibold ${
                            idx === 0
                              ? 'bg-yellow-500'
                              : idx === 1
                                ? 'bg-blue-500'
                                : idx === 2
                                  ? 'bg-green-500'
                                  : 'bg-purple-500'
                          }`}
                          style={{ width: `${method.percentage}%` }}
                        >
                          {method.percentage}%
                        </div>
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm text-gray-400">
                      {method.count}건
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatistics;
