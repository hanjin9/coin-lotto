/**
 * Admin Dashboard with Statistics - 관리자 페이지 (통계 탭 통합)
 * 추첨 관리, 당첨자 확인, 통계 조회
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import PaymentStatisticsWithRealtime from './PaymentStatisticsWithRealtime';

export default function AdminDashboardWithTabs() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'draw' | 'statistics'>('draw');

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ 관리자 대시보드</h1>
          <p className="text-slate-300">로또 추첨 관리 및 통계</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('draw')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'draw'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            🎰 추첨 관리
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'statistics'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            📊 통계
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'draw' && (
          <div>
            <AdminDashboard />
          </div>
        )}

        {activeTab === 'statistics' && (
          <div>
            <PaymentStatisticsWithRealtime />
          </div>
        )}
      </div>
    </div>
  );
}
