/**
 * 간편 회원가입 폼
 * 파일명: client/src/components/SignupForm.tsx
 * 작성자: Manus_AI
 * 작성일: 20260504
 * 
 * 기능:
 * - 최소 정보만 입력 (이름, 휴대폰/이메일)
 * - 비밀번호 자동 생성
 * - 간편한 회원가입
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';

interface SignupFormProps {
  onSignupSuccess?: () => void;
}

export default function SignupForm({ onSignupSuccess }: SignupFormProps) {
  const [signupType, setSignupType] = useState<'phone' | 'email'>('phone');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('82');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const signupWithPhoneMutation = trpc.auth.signupWithPhone.useMutation();
  const signupWithEmailMutation = trpc.auth.signupWithEmail.useMutation();

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    if (!phoneNumber.trim()) {
      alert('휴대폰 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await signupWithPhoneMutation.mutateAsync({
        name,
        countryCode,
        phoneNumber,
      });

      if (result.success) {
        alert('회원가입이 완료되었습니다.');
        onSignupSuccess?.();
      } else {
        alert(result.message || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Phone signup error:', error);
      alert('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    if (!email.trim()) {
      alert('이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await signupWithEmailMutation.mutateAsync({
        name,
        email,
      });

      if (result.success) {
        alert('회원가입이 완료되었습니다.');
        onSignupSuccess?.();
      } else {
        alert(result.message || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Email signup error:', error);
      alert('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-950 rounded-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">회원가입</h2>

      <Tabs value={signupType} onValueChange={(v) => setSignupType(v as 'phone' | 'email')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="phone">휴대폰</TabsTrigger>
          <TabsTrigger value="email">이메일</TabsTrigger>
        </TabsList>

        {/* 휴대폰 회원가입 */}
        <TabsContent value="phone">
          <form onSubmit={handlePhoneSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="bg-slate-900 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">국가번호</Label>
              <select
                id="country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-slate-950 text-white"
              >
                <option value="82">🇰🇷 +82 (Korea)</option>
                <option value="1">🇺🇸 +1 (USA)</option>
                <option value="44">🇬🇧 +44 (UK)</option>
                <option value="81">🇯🇵 +81 (Japan)</option>
                <option value="86">🇨🇳 +86 (China)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">휴대폰 번호</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="010-1234-5678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                className="bg-slate-900 border-gray-600 text-white"
              />
            </div>

            <div className="bg-slate-900 border border-purple-500/30 rounded-lg p-3 text-xs text-gray-400 space-y-1">
              <p>✓ 비밀번호: 휴대폰 뒷자리 4자리</p>
              <p>✓ 로그인 후 프로필에서 변경 가능</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? '가입 중...' : '가입하기'}
            </Button>
          </form>
        </TabsContent>

        {/* 이메일 회원가입 */}
        <TabsContent value="email">
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-name">이름</Label>
              <Input
                id="email-name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="bg-slate-900 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-input">이메일</Label>
              <Input
                id="email-input"
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-slate-900 border-gray-600 text-white"
              />
            </div>

            <div className="bg-slate-900 border border-purple-500/30 rounded-lg p-3 text-xs text-gray-400 space-y-1">
              <p>✓ 비밀번호: 이메일 앞부분 4자리</p>
              <p>✓ 로그인 후 프로필에서 변경 가능</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? '가입 중...' : '가입하기'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
