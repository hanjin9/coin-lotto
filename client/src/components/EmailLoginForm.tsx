import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { trpc } from '@/lib/trpc';

declare global {
  interface Window {
    google?: any;
  }
}

export default function EmailLoginForm() {
  const { toast } = useToast();
  const loginWithGmailMutation = trpc.auth.loginWithGmail.useMutation();

  useEffect(() => {
    // Google Sign-In 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
          callback: handleGoogleSignIn,
        });
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleGoogleSignIn = async (response: any) => {
    try {
      // JWT 토큰 디코딩
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const data = JSON.parse(jsonPayload);

      // 로그인 처리
      const result = await loginWithGmailMutation.mutateAsync({
        email: data.email,
        googleId: data.sub,
        name: data.name,
        picture: data.picture,
      });

      if (result.success) {
        toast({
          title: '성공',
          description: '로그인이 완료되었습니다.',
        });
        window.location.href = '/dashboard';
      } else {
        toast({
          title: '오류',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Gmail 로그인 오류:', error);
      toast({
        title: '오류',
        description: 'Gmail 로그인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div
        id="g_id_onload"
        data-client_id={process.env.REACT_APP_GOOGLE_CLIENT_ID}
        data-callback="handleGoogleSignIn"
      ></div>
      <div
        id="g_id_signin"
        data-type="standard"
        data-size="large"
        data-theme="dark"
        data-text="signin_with"
        data-shape="rectangular"
        data-logo_alignment="left"
        className="flex justify-center"
      ></div>

      <p className="text-center text-sm text-gray-400">
        Gmail 계정으로 빠르게 로그인하세요
      </p>
    </div>
  );
}
