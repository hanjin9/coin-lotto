import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

/**
 * 무기명 로그인 페이지
 * 
 * 기능:
 * 1. 휴대폰/이메일 입력 폼
 * 2. 6자리 인증 코드 입력 폼
 * 3. 재전송 버튼 및 타이머
 * 4. 자동 로그인 및 리다이렉트
 */

type LoginStep = 'contact' | 'verification';
type ContactType = 'phone' | 'email';

interface VerificationState {
  contact: string;
  type: ContactType;
  code: string;
  remainingTime: number;
  resendCount: number;
  maxResends: number;
}

const AnonymousLogin: React.FC = () => {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<LoginStep>('contact');
  const [contactType, setContactType] = useState<ContactType>('phone');
  const [contact, setContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 인증 상태
  const [verification, setVerification] = useState<VerificationState>({
    contact: '',
    type: 'phone',
    code: '',
    remainingTime: 300, // 5분
    resendCount: 0,
    maxResends: 3,
  });

  // 타이머 효과
  useEffect(() => {
    if (step !== 'verification' || verification.remainingTime <= 0) return;

    const timer = setInterval(() => {
      setVerification((prev) => ({
        ...prev,
        remainingTime: Math.max(0, prev.remainingTime - 1),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, verification.remainingTime]);

  // 휴대폰 번호 검증
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // 이메일 검증
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 연락처 입력 폼 제출
  const handleContactSubmit = async () => {
    setError('');
    setSuccess('');

    // 검증
    if (!contact.trim()) {
      setError('연락처를 입력해주세요.');
      return;
    }

    if (contactType === 'phone' && !validatePhoneNumber(contact)) {
      setError('유효한 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)');
      return;
    }

    if (contactType === 'email' && !validateEmail(contact)) {
      setError('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 실제: API 호출 - requestVerificationCode
      // const response = await fetch('/api/auth/request-verification', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ contact, type: contactType }),
      // });

      // 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(
        `${contactType === 'phone' ? 'SMS' : '이메일'}로 인증 코드를 발송했습니다.`
      );

      setVerification({
        contact,
        type: contactType,
        code: '',
        remainingTime: 300,
        resendCount: 0,
        maxResends: 3,
      });

      setStep('verification');
    } catch (err) {
      setError('요청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 코드 입력 폼 제출
  const handleVerificationSubmit = async () => {
    setError('');
    setSuccess('');

    if (!verification.code.trim()) {
      setError('인증 코드를 입력해주세요.');
      return;
    }

    if (verification.code.length !== 6 || !/^\d{6}$/.test(verification.code)) {
      setError('6자리 숫자를 입력해주세요.');
      return;
    }

    if (verification.remainingTime <= 0) {
      setError('인증 코드가 만료되었습니다. 다시 요청해주세요.');
      setStep('contact');
      return;
    }

    setIsLoading(true);

    try {
      // 실제: API 호출 - verifyCode
      // const response = await fetch('/api/auth/verify-code', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     contact: verification.contact,
      //     code: verification.code,
      //   }),
      // });

      // 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess('인증 성공! 로그인 중입니다...');

      // 세션 저장 및 리다이렉트
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } catch (err) {
      setError('인증 코드가 일치하지 않습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 코드 재전송
  const handleResendCode = async () => {
    if (verification.resendCount >= verification.maxResends) {
      setError('재전송 횟수를 초과했습니다. 새로 시작해주세요.');
      setStep('contact');
      return;
    }

    setIsLoading(true);

    try {
      // 실제: API 호출 - resendVerificationCode
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess('인증 코드를 다시 발송했습니다.');
      setVerification((prev) => ({
        ...prev,
        remainingTime: 300,
        resendCount: prev.resendCount + 1,
        code: '',
      }));
    } catch (err) {
      setError('재전송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 뒤로가기
  const handleBack = () => {
    setStep('contact');
    setContact('');
    setVerification({
      contact: '',
      type: 'phone',
      code: '',
      remainingTime: 300,
      resendCount: 0,
      maxResends: 3,
    });
    setError('');
    setSuccess('');
  };

  // 시간 포맷팅 (분:초)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="inline-block bg-yellow-500 text-black rounded-full p-3 mb-3">
              <span className="text-2xl font-bold">WLD</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-white">
            {step === 'contact' ? '로그인' : '인증 코드 입력'}
          </CardTitle>
          <p className="text-sm text-gray-400 mt-2">
            {step === 'contact'
              ? '휴대폰 또는 이메일로 로그인하세요'
              : '발송된 인증 코드를 입력해주세요'}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}

          {/* 연락처 입력 단계 */}
          {step === 'contact' && (
            <div className="space-y-4">
              <Tabs
                value={contactType}
                onValueChange={(value) => {
                  setContactType(value as ContactType);
                  setContact('');
                  setError('');
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                  <TabsTrigger
                    value="phone"
                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    휴대폰
                  </TabsTrigger>
                  <TabsTrigger
                    value="email"
                    className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    이메일
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="phone" className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      휴대폰 번호
                    </label>
                    <Input
                      type="tel"
                      placeholder="010-1234-5678"
                      value={contact}
                      onChange={(e) => {
                        setContact(e.target.value);
                        setError('');
                      }}
                      className="bg-slate-700 border-slate-600 text-white placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      하이픈 포함 또는 제외 모두 가능합니다.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      이메일 주소
                    </label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={contact}
                      onChange={(e) => {
                        setContact(e.target.value);
                        setError('');
                      }}
                      className="bg-slate-700 border-slate-600 text-white placeholder-gray-500"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleContactSubmit}
                disabled={isLoading || !contact.trim()}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold h-10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    발송 중...
                  </>
                ) : (
                  '인증 코드 발송'
                )}
              </Button>
            </div>
          )}

          {/* 인증 코드 입력 단계 */}
          {step === 'verification' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">
                  인증 코드 (6자리)
                </label>
                <Input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verification.code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setVerification((prev) => ({ ...prev, code: value }));
                    setError('');
                  }}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-500 text-center text-2xl tracking-widest"
                />
              </div>

              {/* 타이머 및 재전송 */}
              <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">남은 시간</p>
                  <p
                    className={`text-lg font-bold ${
                      verification.remainingTime <= 60
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {formatTime(verification.remainingTime)}
                  </p>
                </div>

                <Button
                  onClick={handleResendCode}
                  disabled={
                    isLoading ||
                    verification.resendCount >= verification.maxResends
                  }
                  variant="outline"
                  className="border-slate-600 text-gray-300 hover:bg-slate-600"
                >
                  재전송 ({verification.resendCount}/{verification.maxResends})
                </Button>
              </div>

              <Button
                onClick={handleVerificationSubmit}
                disabled={
                  isLoading ||
                  verification.code.length !== 6 ||
                  verification.remainingTime <= 0
                }
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold h-10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    검증 중...
                  </>
                ) : (
                  '인증 완료'
                )}
              </Button>

              <Button
                onClick={handleBack}
                disabled={isLoading}
                variant="ghost"
                className="w-full text-gray-400 hover:text-gray-300 hover:bg-slate-700"
              >
                뒤로가기
              </Button>
            </div>
          )}

          {/* 약관 동의 */}
          <div className="text-xs text-gray-500 text-center">
            로그인하면{' '}
            <a href="#" className="text-yellow-400 hover:underline">
              이용약관
            </a>
            과{' '}
            <a href="#" className="text-yellow-400 hover:underline">
              개인정보처리방침
            </a>
            에 동의합니다.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnonymousLogin;
