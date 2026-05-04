import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * 인증 상태를 관리하는 커스텀 훅
 */

export interface AuthUser {
  id: number;
  email?: string;
  role: 'admin' | 'user';
  name?: string | null;
  openId?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // tRPC를 통해 현재 사용자 정보 조회
  const { data: currentUser, isLoading: isFetching } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!isFetching) {
      if (currentUser && typeof currentUser === 'object' && 'role' in currentUser) {
        setUser(currentUser as unknown as AuthUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [currentUser, isFetching]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

/**
 * 관리자 권한 확인 훅
 */
export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === 'admin';
}

/**
 * 로그아웃 함수
 */
export function useLogout() {
  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      // 로그아웃 후 홈으로 리다이렉트
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return logout;
}
