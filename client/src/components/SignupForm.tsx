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
import { useToast } from '@/components/ui/use-toast';
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
  const { toast } = useToast();

  const signupWithPhoneMutation = trpc.auth.signupWithPhone.useMutation();
  const signupWithEmailMutation = trpc.auth.signupWithEmail.useMutation();

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: '오류',
        description: '이름을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: '오류',
        description: '휴대폰 번호를 입력해주세요.',
        variant: 'destructive',
      });
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
        toast({
          title: '성공',
          description: '회원가입이 완료되었습니다. 자동 생성된 비밀번호로 로그인하세요.',
        });
        setName('');
        setPhoneNumber('');
        onSignupSuccess?.();
      } else {
        toast({
          title: '오류',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '회원가입 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: '오류',
        description: '이름을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: '오류',
        description: '이메일을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await signupWithEmailMutation.mutateAsync({
        name,
        email,
      });

      if (result.success) {
        toast({
          title: '성공',
          description: '회원가입이 완료되었습니다. 자동 생성된 비밀번호로 로그인하세요.',
        });
        setName('');
        setEmail('');
        onSignupSuccess?.();
      } else {
        toast({
          title: '오류',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '회원가입 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs value={signupType} onValueChange={(v) => setSignupType(v as 'phone' | 'email')} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="phone">📱 휴대폰</TabsTrigger>
        <TabsTrigger value="email">📧 이메일</TabsTrigger>
      </TabsList>

      {/* 휴대폰 회원가입 */}
      <TabsContent value="phone">
        <form onSubmit={handlePhoneSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name-phone">이름</Label>
            <Input
              id="signup-name-phone"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-900 border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country-code-phone">국가 코드</Label>
            <select
              id="country-code-phone"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="82">🇰🇷 대한민국 (+82)</option>
              <option value="1">🇺🇸 미국 (+1)</option>
              <option value="44">🇬🇧 영국 (+44)</option>
              <option value="81">🇯🇵 일본 (+81)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone-signup">휴대폰 번호</Label>
            <Input
              id="phone-signup"
              type="tel"
              placeholder="010-1234-5678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="bg-slate-900 border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="bg-slate-900 border border-purple-500/30 rounded-lg p-3 text-xs text-gray-400">
            <p>✓ 비밀번호: 휴대폰 뒷자리 4자리</p>
            <p>✓ 로그인 후 프로필에서 변경 가능</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {loading ? '가입 중...' : '회원가입'}
          </Button>
        </form>
      </TabsContent>

      {/* 이메일 회원가입 */}
      <TabsContent value="email">
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name-email">이름</Label>
            <Input
              id="signup-name-email"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-900 border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-signup">이메일</Label>
            <Input
              id="email-signup"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-900 border-gray-600 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="bg-slate-900 border border-purple-500/30 rounded-lg p-3 text-xs text-gray-400">
            <p>✓ 비밀번호: 이메일 앞부분 4자리</p>
            <p>✓ 로그인 후 프로필에서 변경 가능</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {loading ? '가입 중...' : '회원가입'}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
