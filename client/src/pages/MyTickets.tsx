/**
 * My Tickets - 내 응모권 목록 페이지
 * 사용자가 응모한 응모권들을 확인하고 관리합니다.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LotteryTicket, LotteryTicketData } from '@/components/LotteryTicket';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<LotteryTicketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'drawn'>('all');

  // tRPC 쿼리
  const listTickets = trpc.lottery.list.useQuery(
    { limit: 20, offset: 0 },
    { enabled: !!user }
  );

  // 응모권 목록 로드
  useEffect(() => {
    if (listTickets.data) {
      const formattedTickets: LotteryTicketData[] = listTickets.data.map((t: any) => ({
        id: t.id,
        numbers: t.numbers,
        status: t.status as 'pending' | 'confirmed' | 'drawn' | 'won' | 'lost',
        walletAddress: t.walletAddress || undefined,
        createdAt: new Date(t.createdAt),
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
      }));
      setTickets(formattedTickets);
      setIsLoading(false);
    }
  }, [listTickets.data]);

  // 필터링된 응모권
  const filteredTickets = tickets.filter((ticket) => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  // 상태별 통계
  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    confirmed: tickets.filter((t) => t.status === 'confirmed').length,
    drawn: tickets.filter((t) => t.status === 'drawn').length,
    won: tickets.filter((t) => t.status === 'won').length,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">로그인이 필요합니다.</p>
          <Button className="bg-cyan-500 hover:bg-cyan-600">로그인</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎫 내 응모권</h1>
          <p className="text-slate-300">응모한 응모권을 확인하고 관리하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700 p-4">
            <p className="text-slate-400 text-sm">전체</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </Card>
          <Card className="bg-yellow-900/20 border-yellow-700/30 p-4">
            <p className="text-yellow-400 text-sm">대기</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          </Card>
          <Card className="bg-blue-900/20 border-blue-700/30 p-4">
            <p className="text-blue-400 text-sm">확정</p>
            <p className="text-2xl font-bold text-blue-400">{stats.confirmed}</p>
          </Card>
          <Card className="bg-purple-900/20 border-purple-700/30 p-4">
            <p className="text-purple-400 text-sm">추첨</p>
            <p className="text-2xl font-bold text-purple-400">{stats.drawn}</p>
          </Card>
          <Card className="bg-green-900/20 border-green-700/30 p-4">
            <p className="text-green-400 text-sm">당첨</p>
            <p className="text-2xl font-bold text-green-400">{stats.won}</p>
          </Card>
        </div>

        {/* 필터 버튼 */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(['all', 'pending', 'confirmed', 'drawn'] as const).map((f) => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              variant={filter === f ? 'default' : 'outline'}
              className={filter === f ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
            >
              {f === 'all' && '전체'}
              {f === 'pending' && '⏳ 대기'}
              {f === 'confirmed' && '✅ 확정'}
              {f === 'drawn' && '🎰 추첨'}
            </Button>
          ))}
        </div>

        {/* 응모권 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-300">로드 중...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">응모권이 없습니다.</p>
            <Button className="bg-cyan-500 hover:bg-cyan-600">
              응모하기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <LotteryTicket
                key={ticket.id}
                ticket={ticket}
                onView={(id) => console.log('View ticket:', id)}
                onCancel={async (id) => {
                  console.log('Cancel ticket:', id);
                  // TODO: 응모권 취소 API 호출
                }}
              />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {filteredTickets.length > 0 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button variant="outline">이전</Button>
            <Button variant="default" className="bg-cyan-500 hover:bg-cyan-600">
              1
            </Button>
            <Button variant="outline">다음</Button>
          </div>
        )}
      </div>
    </div>
  );
}
