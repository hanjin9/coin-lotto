/**
 * 통합 로그인 페이지
 * 파일명: client/src/pages/LoginPage.tsx
 * 작성자: Manus_AI
 * 작성일: 20260504
 * 
 * 기능:
 * - 휴대폰 인증 로그인
 * - Gmail 로그인
 * - Naver 로그인
 * - 회원가입
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhoneLoginForm from '@/components/PhoneLoginForm';
import EmailLoginForm from '@/components/EmailLoginForm';
import SignupForm from '@/components/SignupForm';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('phone');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-purple-500/20">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Web3 Lotto
          </CardTitle>
          <CardDescription className="text-gray-400">
            로그인하여 로또에 참여하세요
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="phone" className="text-xs sm:text-sm">
                📱 휴대폰
              </TabsTrigger>
              <TabsTrigger value="email" className="text-xs sm:text-sm">
                📧 Gmail
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-xs sm:text-sm">
                ✍️ 가입
              </TabsTrigger>
            </TabsList>

            {/* 휴대폰 로그인 */}
            <TabsContent value="phone" className="space-y-4">
              <PhoneLoginForm />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600"></span>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-950 text-gray-400">또는</span>
                </div>
              </div>

              {/* 소셜 로그인 */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-purple-500/30 hover:bg-purple-500/10"
                  onClick={() => setActiveTab('email')}
                >
                  Gmail로 로그인
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-green-500/30 hover:bg-green-500/10"
                  onClick={() => {
                    // Naver 로그인 처리
                    window.location.href = `https://nid.naver.com/oauth2.0/authorize?client_id=${process.env.REACT_APP_NAVER_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/naver/callback&response_type=code&state=random_state`;
                  }}
                >
                  🟢 Naver로 로그인
                </Button>
              </div>

              <p className="text-center text-sm text-gray-400">
                계정이 없으신가요?{' '}
                <button
                  onClick={() => setActiveTab('signup')}
                  className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                  가입하기
                </button>
              </p>
            </TabsContent>

            {/* 이메일 로그인 */}
            <TabsContent value="email" className="space-y-4">
              <EmailLoginForm />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600"></span>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-950 text-gray-400">또는</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-green-500/30 hover:bg-green-500/10"
                onClick={() => {
                  // Naver 로그인 처리
                  window.location.href = `https://nid.naver.com/oauth2.0/authorize?client_id=${process.env.REACT_APP_NAVER_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/naver/callback&response_type=code&state=random_state`;
                }}
              >
                🟢 Naver로 로그인
              </Button>

              <p className="text-center text-sm text-gray-400">
                계정이 없으신가요?{' '}
                <button
                  onClick={() => setActiveTab('signup')}
                  className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                  가입하기
                </button>
              </p>
            </TabsContent>

            {/* 회원가입 */}
            <TabsContent value="signup" className="space-y-4">
              <SignupForm onSignupSuccess={() => setActiveTab('phone')} />

              <p className="text-center text-sm text-gray-400">
                이미 계정이 있으신가요?{' '}
                <button
                  onClick={() => setActiveTab('phone')}
                  className="text-purple-400 hover:text-purple-300 font-semibold"
                >
                  로그인하기
                </button>
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
