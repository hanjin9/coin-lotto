/**
 * 통합 로그인 페이지 (회원가입 겸 로그인)
 * 파일명: client/src/pages/LoginPage.tsx
 * 작성자: Manus_AI
 * 작성일: 20260504
 * 
 * 기능:
 * - 휴대폰 인증 (국가번호 선택)
 * - 이메일 로그인/회원가입
 * - 다국어 지원 (한국어, 영어)
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhoneLoginForm from '@/components/PhoneLoginForm';
import EmailLoginForm from '@/components/EmailLoginForm';

type Language = 'ko' | 'en';

const translations = {
  ko: {
    title: '로그인',
    subtitle: '휴대폰 또는 이메일로 로그인하세요',
    phone: '휴대폰',
    email: '이메일',
    terms: '이용약관',
    privacy: '개인정보처리방침',
    agree: '로그인하면 이용약관과 개인정보처리방침에 동의합니다.',
  },
  en: {
    title: 'Login',
    subtitle: 'Sign in with phone or email',
    phone: 'Phone',
    email: 'Email',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    agree: 'By signing in, you agree to the Terms of Service and Privacy Policy.',
  },
};

export default function LoginPage() {
  const [language, setLanguage] = useState<Language>('ko');
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* 언어 선택 버튼 (우측 상단) */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setLanguage('ko')}
          className={`px-3 py-1 rounded text-sm font-medium transition-all ${
            language === 'ko'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          한국어
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded text-sm font-medium transition-all ${
            language === 'en'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          English
        </button>
      </div>

      {/* 로그인 카드 */}
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-block bg-yellow-400 rounded-full px-4 py-2 mb-4">
            <span className="text-2xl font-bold text-slate-900">WLD</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
          <p className="text-gray-400">{t.subtitle}</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-slate-800/50 backdrop-blur border border-purple-500/20 rounded-lg p-6 space-y-6">
          <Tabs defaultValue="phone" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-slate-700">
              <TabsTrigger
                value="phone"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                {t.phone}
              </TabsTrigger>
              <TabsTrigger
                value="email"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                {t.email}
              </TabsTrigger>
            </TabsList>

            {/* 휴대폰 로그인/회원가입 */}
            <TabsContent value="phone" className="mt-6">
              <PhoneLoginForm language={language} />
            </TabsContent>

            {/* 이메일 로그인/회원가입 */}
            <TabsContent value="email" className="mt-6">
              <EmailLoginForm language={language} />
            </TabsContent>
          </Tabs>
        </div>

        {/* 약관 동의 */}
        <div className="mt-6 text-center text-xs text-gray-500 space-y-2">
          <p>{t.agree}</p>
          <div className="flex justify-center gap-4">
            <a href="#" className="text-purple-400 hover:text-purple-300 underline">
              {t.terms}
            </a>
            <span>·</span>
            <a href="#" className="text-purple-400 hover:text-purple-300 underline">
              {t.privacy}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
