/**
 * 휴대폰 로그인/회원가입 폼 (통합)
 * 파일명: client/src/components/PhoneLoginForm.tsx
 * 작성자: Manus_AI
 * 작성일: 20260504
 * 
 * 기능:
 * - 국가번호 선택
 * - 휴대폰 번호 입력
 * - 인증 코드 발송/검증
 * - 로그인/회원가입 통합
 * - 다국어 지원
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { UN_COUNTRIES } from '@/data/countries';

type Language = 'ko' | 'en';

const translations = {
  ko: {
    countryCode: '국가번호',
    phoneNumber: '휴대폰 번호',
    phonePlaceholder: '010-1234-5678',
    sendCode: '인증 코드 발송',
    enterCode: '인증 코드 입력',
    codePlaceholder: '000000',
    verify: '인증',
    login: '로그인',
    signup: '회원가입',
    name: '이름',
    namePlaceholder: '홍길동',
    register: '가입하기',
    passwordInfo: '비밀번호: 휴대폰 뒷자리 4자리',
    canChangePassword: '로그인 후 프로필에서 변경 가능',
    sending: '발송 중...',
    verifying: '검증 중...',
    registering: '가입 중...',
    changeNumber: '다른 번호로 시도',
    codeReceived: '인증 코드가 발송되었습니다.',
    loginSuccess: '로그인이 완료되었습니다.',
    signupSuccess: '회원가입이 완료되었습니다.',
    enterPhone: '휴대폰 번호를 입력해주세요.',
    enterName: '이름을 입력해주세요.',
    error: '오류',
    success: '성공',
  },
  en: {
    countryCode: 'Country Code',
    phoneNumber: 'Phone Number',
    phonePlaceholder: '010-1234-5678',
    sendCode: 'Send Code',
    enterCode: 'Enter Code',
    codePlaceholder: '000000',
    verify: 'Verify',
    login: 'Login',
    signup: 'Sign Up',
    name: 'Name',
    namePlaceholder: 'John Doe',
    register: 'Register',
    passwordInfo: 'Password: Last 4 digits of phone',
    canChangePassword: 'Change password after login',
    sending: 'Sending...',
    verifying: 'Verifying...',
    registering: 'Registering...',
    changeNumber: 'Try another number',
    codeReceived: 'Verification code sent.',
    loginSuccess: 'Login successful.',
    signupSuccess: 'Registration successful.',
    enterPhone: 'Please enter phone number.',
    enterName: 'Please enter your name.',
    error: 'Error',
    success: 'Success',
  },
};

interface PhoneLoginFormProps {
  language?: Language;
}

export default function PhoneLoginForm({ language = 'ko' }: PhoneLoginFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'phone' | 'code' | 'name'>('phone');
  const [countryCode, setCountryCode] = useState('82');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeId, setCodeId] = useState('');

  const t = translations[language];
  const sendPhoneVerification = trpc.auth.sendPhoneVerification.useMutation();
  const verifyPhoneCode = trpc.auth.verifyPhoneCode.useMutation();
  const signupWithPhoneMutation = trpc.auth.signupWithPhone.useMutation();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      alert(t.enterPhone);
      return;
    }

    setLoading(true);
    try {
      const result = await sendPhoneVerification.mutateAsync({
        countryCode,
        phoneNumber,
      });

      if (result.success && result.codeId) {
        setCodeId(result.codeId);
        setStep('code');
        alert(t.codeReceived);
      } else {
        alert(result.message || t.error);
      }
    } catch (error) {
      console.error('Error sending code:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      alert(t.enterCode);
      return;
    }

    setLoading(true);
    try {
      const result = await verifyPhoneCode.mutateAsync({
        countryCode,
        phoneNumber,
        code: verificationCode,
      });

      if (result.success) {
        if (mode === 'login') {
          alert(t.loginSuccess);
          // 로그인 처리
        } else {
          setStep('name');
        }
      } else {
        alert(result.message || t.error);
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(t.enterName);
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
        alert(t.signupSuccess);
        // 회원가입 처리
      } else {
        alert(result.message || t.error);
      }
    } catch (error) {
      console.error('Error signing up:', error);
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-950 rounded-lg border border-gray-700">
      {/* 탭 선택 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode('login'); setStep('phone'); }}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
            mode === 'login'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {t.login}
        </button>
        <button
          onClick={() => { setMode('signup'); setStep('phone'); }}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
            mode === 'signup'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {t.signup}
        </button>
      </div>

      {/* 휴대폰 번호 입력 단계 */}
      {step === 'phone' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country-code">{t.countryCode}</Label>
            <select
              id="country-code"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-md bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 max-h-64 overflow-y-auto"
            >
              {UN_COUNTRIES.map((country) => (
                <option key={`${country.code}-${country.country}`} value={country.code}>
                  {country.flag} +{country.code} {country.country}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t.phoneNumber}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t.phonePlaceholder}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
              className="bg-slate-900 border-gray-600 text-white"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? t.sending : t.sendCode}
          </Button>
        </form>
      )}

      {/* 인증 코드 입력 단계 */}
      {step === 'code' && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">{t.enterCode}</Label>
            <Input
              id="code"
              type="text"
              placeholder={t.codePlaceholder}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={loading}
              className="bg-slate-900 border-gray-600 text-white"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? t.verifying : t.verify}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('phone')}
            disabled={loading}
            className="w-full"
          >
            {t.changeNumber}
          </Button>
        </form>
      )}

      {/* 이름 입력 단계 (회원가입) */}
      {step === 'name' && mode === 'signup' && (
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.name}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="bg-slate-900 border-gray-600 text-white"
            />
          </div>

          <div className="text-sm text-gray-400">
            <p>{t.passwordInfo}</p>
            <p className="text-xs mt-1">{t.canChangePassword}</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? t.registering : t.register}
          </Button>
        </form>
      )}
    </div>
  );
}
