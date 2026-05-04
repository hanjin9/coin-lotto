/**
 * My Page - 마이페이지
 * 사용자 프로필, 응모 기록, 당첨 기록 조회
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/_core/hooks/useAuth';

export default function MyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-900/30 border-red-600/50 p-6">
            <h1 className="text-2xl font-bold text-red-400 mb-2">로그인 필요</h1>
            <p className="text-red-300">마이페이지를 보려면 로그인해주세요.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">👤 마이페이지</h1>
          <p className="text-slate-300">사용자 정보 및 응모 기록</p>
        </div>

        {/* 프로필 카드 */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{user.name || '사용자'}</h2>
              <p className="text-slate-300 mb-1">📧 {user.email || '이메일 없음'}</p>
              <p className="text-slate-400 text-sm">가입일: 2026-04-15</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-yellow-400 mb-2">₩98.7M</div>
              <p className="text-slate-300">총 응모 금액</p>
            </div>
          </div>
        </Card>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">총 응모권</div>
            <div className="text-3xl font-bold text-white">24</div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">당첨 횟수</div>
            <div className="text-3xl font-bold text-green-400">3</div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">총 상금</div>
            <div className="text-3xl font-bold text-blue-400">₩15.2M</div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="text-slate-400 text-sm mb-2">당첨율</div>
            <div className="text-3xl font-bold text-purple-400">12.5%</div>
          </Card>
        </div>

        {/* 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700 rounded-lg p-1">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
            >
              프로필
            </TabsTrigger>
            <TabsTrigger
              value="tickets"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
            >
              응모 기록
            </TabsTrigger>
            <TabsTrigger
              value="winnings"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300"
            >
              당첨 기록
            </TabsTrigger>
          </TabsList>

          {/* 프로필 탭 */}
          <TabsContent value="profile" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">📋 기본 정보</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">이름</label>
                  <input
                    type="text"
                    value={user.name || ''}
                    readOnly
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-1">이메일</label>
                  <input
                    type="email"
                    value={user.email || ''}
                    readOnly
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-1">지갑 주소</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500"
                  />
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 mt-4">
                  저장
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* 응모 기록 탭 */}
          <TabsContent value="tickets" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">🎰 응모 기록</h3>

              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-slate-700/30 p-4 rounded border border-slate-600">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-bold">응모권 #{i}</h4>
                        <p className="text-slate-400 text-sm">2026-04-{15 + i}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        i % 2 === 0
                          ? 'bg-green-600/30 text-green-400'
                          : 'bg-yellow-600/30 text-yellow-400'
                      }`}>
                        {i % 2 === 0 ? '확정' : '대기'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">번호: {1 + i}, {5 + i}, {10 + i}, {15 + i}, {20 + i}, {25 + i}</p>
                    <p className="text-slate-400 text-sm mt-1">금액: ₩{i * 10}K</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* 당첨 기록 탭 */}
          <TabsContent value="winnings" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">🏆 당첨 기록</h3>

              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 p-4 rounded border border-yellow-600/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-yellow-400 font-bold">🥇 {i === 1 ? '1등' : i === 2 ? '2등' : '3등'}</h4>
                        <p className="text-slate-400 text-sm">2026-04-{20 + i}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-bold text-lg">₩{i * 100}M</p>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm">응모권 #{i} - 맞은 번호: {i === 1 ? '6개' : i === 2 ? '5개+보너스' : '5개'}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
