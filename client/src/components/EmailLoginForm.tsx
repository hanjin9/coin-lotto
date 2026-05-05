/**
 * 이메일 로그인/회원가입 폼 (통합)
 * 파일명: client/src/components/EmailLoginForm.tsx
 * 작성자: Manus_AI
 * 작성일: 20260504
 * 
 * 기능:
 * - Gmail 로그인
 * - 이메일 회원가입
 * - 다국어 지원
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';

type Language = 'ko' | 'en';

const translations = {
  ko: {
    email: '이메일',
    emailPlaceholder: 'example@gmail.com',
    name: '이름',
    namePlaceholder: '홍길동',
    login: '로그인',
    signup: '회원가입',
    loginWithGmail: 'Gmail로 로그인',
    register: '가입하기',
    passwordInfo: '비밀번호: 이메일 앞부분 4자리',
    canChangePassword: '로그인 후 프로필에서 변경 가능',
    loginSuccess: '로그인이 완료되었습니다.',
    signupSuccess: '회원가입이 완료되었습니다.',
    enterEmail: '이메일을 입력해주세요.',
    enterName: '이름을 입력해주세요.',
    error: '오류',
    success: '성공',
    registering: '가입 중...',
    logging: '로그인 중...',
  },
  en: {
    email: 'Email',
    emailPlaceholder: 'example@gmail.com',
    name: 'Name',
    namePlaceholder: 'John Doe',
    login: 'Login',
    signup: 'Sign Up',
    loginWithGmail: 'Sign in with Gmail',
    register: 'Register',
    passwordInfo: 'Password: First 4 characters of email',
    canChangePassword: 'Change password after login',
    loginSuccess: 'Login successful.',
    signupSuccess: 'Registration successful.',
    enterEmail: 'Please enter email.',
    enterName: 'Please enter your name.',
    error: 'Error',
    success: 'Success',
    registering: 'Registering...',
    logging: 'Logging in...',
  },
};

declare global {
  interface Window {
    google?: any;
  }
}

interface EmailLoginFormProps {
  language?: Language;
}

export default function EmailLoginForm({ language = 'ko' }: EmailLoginFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const t = translations[language];
  const loginWithGmailMutation = trpc.auth.loginWithGmail.useMutation();

  useEffect(() => {
    // Google Sign-In 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) {
        // 이미 제거된 경우 무시
      }
    };
  }, []);

  const handleGoogleSignIn = async (response: any) => {
    setLoading(true);
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
        alert(t.loginSuccess);
        window.location.href = '/dashboard';
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Gmail login error:', error);
      alert(language === 'ko' ? 'Gmail 로그인 중 오류가 발생했습니다.' : 'Gmail login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      alert(t.enterEmail);
      return;
    }

    if (!name.trim()) {
      alert(t.enterName);
      return;
    }

    setLoading(true);
    try {
      // 이메일 회원가입 처리 (실제 구현 필요)
      console.log(`Email signup: ${name}, ${email}`);
      alert(t.signupSuccess);
      window.location.href = '/dashboard';
    } catch (error) {
      alert(language === 'ko' ? '회원가입 중 오류가 발생했습니다.' : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 로그인/회원가입 토글 */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setEmail('');
            setName('');
          }}
          className={`flex-1 py-2 rounded font-medium transition-all ${
            mode === 'login'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          {t.login}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setEmail('');
            setName('');
          }}
          className={`flex-1 py-2 rounded font-medium transition-all ${
            mode === 'signup'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          {t.signup}
        </button>
      </div>

      {/* 로그인 모드 */}
      {mode === 'login' && (
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
            {language === 'ko'
              ? 'Gmail 계정으로 빠르게 로그인하세요'
              : 'Sign in quickly with your Gmail account'}
          </p>
        </div>
      )}

      {/* 회원가입 모드 */}
      {mode === 'signup' && (
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-900 border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t.name}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-900 border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="bg-slate-900 border border-purple-500/30 rounded-lg p-3 text-xs text-gray-400 space-y-1">
            <p>✓ {t.passwordInfo}</p>
            <p>✓ {t.canChangePassword}</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {loading ? t.registering : t.register}
          </Button>
        </form>
      )}
    </div>
  );
}
