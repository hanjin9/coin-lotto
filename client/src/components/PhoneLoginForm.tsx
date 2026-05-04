/**
 * 휴대폰 인증 로그인 폼
 * 파일명: client/src/components/PhoneLoginForm.tsx
 * 작성자: Manus_AI
 * 작성일: 20260504
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { trpc } from '@/lib/trpc';

export default function PhoneLoginForm() {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [countryCode, setCountryCode] = useState('82');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendPhoneMutation = trpc.auth.sendPhoneVerification.useMutation();
  const verifyPhoneMutation = trpc.auth.verifyPhoneCode.useMutation();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const result = await sendPhoneMutation.mutateAsync({
        countryCode,
        phoneNumber,
      });

      if (result.success) {
        toast({
          title: '성공',
          description: '인증 코드가 발송되었습니다.',
        });
        setStep('code');
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
        description: '인증 코드 발송 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      toast({
        title: '오류',
        description: '인증 코드를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await verifyPhoneMutation.mutateAsync({
        countryCode,
        phoneNumber,
        code: verificationCode,
      });

      if (result.success) {
        toast({
          title: '성공',
          description: '로그인이 완료되었습니다.',
        });
        // 로그인 성공 후 리다이렉트
        window.location.href = '/dashboard';
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
        description: '인증 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="country-code">국가 코드</Label>
          <select
            id="country-code"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-md bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="82">🇰🇷 대한민국 (+82)</option>
            <option value="1">🇺🇸 미국 (+1)</option>
            <option value="44">🇬🇧 영국 (+44)</option>
            <option value="81">🇯🇵 일본 (+81)</option>
            <option value="86">🇨🇳 중국 (+86)</option>
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
            className="bg-slate-900 border-gray-600 text-white placeholder:text-gray-500"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {loading ? '발송 중...' : '인증 코드 발송'}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyCode} className="space-y-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-lg p-3 text-sm text-gray-300">
        <p className="text-center">
          <strong>{phoneNumber}</strong>로 인증 코드가 발송되었습니다.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">인증 코드 (6자리)</Label>
        <Input
          id="code"
          type="text"
          placeholder="000000"
          maxLength={6}
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
          className="bg-slate-900 border-gray-600 text-white placeholder:text-gray-500 text-center text-2xl tracking-widest"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        {loading ? '검증 중...' : '로그인'}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={() => setStep('phone')}
        className="w-full text-gray-400 hover:text-gray-300"
      >
        다른 번호로 시도
      </Button>
    </form>
  );
}
