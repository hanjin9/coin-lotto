import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [wldPrice, setWldPrice] = useState(12500);
  const [isTargetReached, setIsTargetReached] = useState(true);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState<"home" | "purchase" | "apply" | "numbers">("home");
  const [hasTransferred, setHasTransferred] = useState(false);
  const [ticketIssued, setTicketIssued] = useState(false);
  const [fingerPointing, setFingerPointing] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const price = Math.random() * 15000 + 5000;
      setWldPrice(price);
      setIsTargetReached(price >= 10000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentStep === "home") {
      const interval = setInterval(() => {
        setFingerPointing((prev) => (prev === 3 ? 1 : prev + 1));
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const toggleNumber = (num: number) => {
    setSelectedNumbers((prev) =>
      prev.includes(num)
        ? prev.filter((n) => n !== num)
        : prev.length < 6
          ? [...prev, num].sort((a, b) => a - b)
          : prev
    );
  };

  const handleApplyClick = () => {
    if (hasTransferred) {
      setTicketIssued(true);
      setTimeout(() => setCurrentStep("numbers"), 1500);
    } else {
      setCurrentStep("purchase");
    }
  };

  if (currentStep === "home") {
    return (
      <div
        className="min-h-screen w-full relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://cdn.manus.space/lotto_background_theater_lights.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          filter: 'brightness(2.5) contrast(1.3) saturate(1.2)',
        }}
      >
        <div className="fixed inset-0 bg-black/10 pointer-events-none" />

        <header className="sticky top-0 z-50 w-full bg-black/70 backdrop-blur-md border-b border-yellow-500/40">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center font-bold text-black">
                🎰
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-yellow-400">WLD LOTTO</h1>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated && user ? (
                <>
                  <span className="text-yellow-300 font-bold text-sm sm:text-base">{user.name}</span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 font-bold rounded-lg transition-all"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <a href={getLoginUrl()} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-all">
                  로그인
                </a>
              )}
            </div>
          </div>
        </header>

        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
          {/* 제목 */}
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black text-yellow-300">
              월드코인으로 시작하는
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-yellow-400 drop-shadow-lg">
              프리미엄 로또
            </h3>
          </div>

          {/* 3단계 버튼 섹션 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 mb-16">
            {/* 1단계: 응모권 구입 (좌측) */}
            <div className="relative group">
              {fingerPointing === 1 && (
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 animate-bounce text-5xl z-20" style={{ transform: 'translateX(-50%) scaleY(-1)' }}>
                  👆
                </div>
              )}
              <button
                onClick={() => setCurrentStep("purchase")}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full font-bold text-xl sm:text-2xl transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-2xl flex items-center justify-center flex-col gap-1 animate-float-neon"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, rgba(255, 40, 40, 1), rgba(200, 20, 20, 0.95))',
                  boxShadow: 'max(0px, 0 0 20px rgba(255, 60, 60, 0.4), 0 0 40px rgba(255, 80, 80, 0.25), 0 15px 20px rgba(255, 60, 60, 0.35), inset -5px -5px 15px rgba(0,0,0,0.6), inset 5px 5px 15px rgba(255,150,150,0.4))',
                  border: '4px solid rgba(255, 80, 80, 0.95)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span className="text-3xl">💰</span>
                <span className="text-xs text-white font-bold">구입</span>
              </button>
            </div>

            {/* 2단계: 응모하기 (중앙) - 가장 눈에 띄게 */}
            <div className="relative group">
              {fingerPointing === 2 && (
                <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 animate-bounce text-6xl z-20" style={{ transform: 'translateX(-50%) scaleY(-1)' }}>
                  👆
                </div>
              )}
              <button
                onClick={handleApplyClick}
                disabled={!isTargetReached && !hasTransferred}
                className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full font-bold text-2xl sm:text-3xl transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-2xl flex items-center justify-center flex-col gap-2 ${
                  isTargetReached || hasTransferred
                    ? "cursor-pointer animate-float-neon"
                    : "opacity-60 cursor-not-allowed"
                }`}
                style={{
                  background: 'radial-gradient(circle at 35% 35%, rgba(255, 210, 80, 1), rgba(240, 160, 40, 0.95))',
                  boxShadow: '0 0 10px rgba(255, 200, 50, 0.2), 0 0 20px rgba(255, 200, 80, 0.15), 0 0 25px rgba(255, 180, 0, 0.1), 0 10px 15px rgba(255, 180, 0, 0.15), inset -8px -8px 20px rgba(0,0,0,0.7), inset 8px 8px 20px rgba(255,240,150,0.5)',
                  border: '5px solid rgba(255, 210, 80, 1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span className="text-5xl sm:text-6xl">🎟️</span>
                <span className="text-lg sm:text-2xl font-black" style={{ color: '#d63447' }}>응모</span>
              </button>
            </div>

            {/* 3단계: 응모권 발급 (우측) */}
            <div className="relative group">
              {fingerPointing === 3 && (
                <div className="absolute -bottom-16 right-1/2 transform translate-x-1/2 animate-bounce text-5xl z-20" style={{ transform: 'translateX(50%) scaleY(-1)' }}>
                  👆
                </div>
              )}
              <button
                onClick={() => setCurrentStep("purchase")}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full font-bold text-xl sm:text-2xl transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-2xl flex items-center justify-center flex-col gap-1 animate-float-neon animate-green-border-pulse`}
                style={{
                  background: 'radial-gradient(circle at 35% 35%, rgba(40, 160, 70, 1), rgba(25, 120, 50, 0.9))',
                  boxShadow: '0 0 10px rgba(40, 160, 70, 0.2), 0 0 20px rgba(80, 180, 100, 0.15), 0 10px 15px rgba(40, 160, 70, 0.15), inset -5px -5px 15px rgba(0,0,0,0.6), inset 5px 5px 15px rgba(120,220,150,0.4)',
                  border: '4px solid rgba(60, 180, 90, 0.95)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <span className="text-3xl">✅</span>
                <span className="text-xs text-white font-bold">발급</span>
              </button>
            </div>
          </div>

          {/* 상태 표시 */}
          <div className="text-center space-y-2 mt-8">
            <p className="text-xl text-yellow-300 font-bold">
              {hasTransferred ? "✓ 송금 완료" : "송금 대기 중"}
            </p>
            <p className="text-sm text-yellow-200">
              {isTargetReached ? "응모 가능" : "응모 불가"}
            </p>
          </div>

          {/* WLD 시세 정보 */}
          <Card className="mt-12 w-full max-w-md bg-black/60 border-yellow-500/50 backdrop-blur-md">
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-yellow-300 font-bold text-sm">WLD 현재 시세</p>
                <p className="text-4xl font-black text-yellow-400">₩{wldPrice.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-200">응모 필요액</span>
                <span className="text-yellow-400 font-bold">₩10,000</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-200">상태</span>
                <span className={`font-bold ${isTargetReached ? 'text-green-400' : 'text-red-400'}`}>
                  {isTargetReached ? "✓ 응모 가능" : "✗ 응모 불가"}
                </span>
              </div>
            </div>
          </Card>

          {/* 추첨 일정 */}
          <div className="mt-12 text-center space-y-2 text-yellow-200">
            <p className="text-sm">📅 추첨 일정</p>
            <p className="text-lg font-bold text-yellow-300">매주 토요일 20:45</p>
            <p className="text-xs text-yellow-100">응모 마감: 토요일 20:00</p>
          </div>
        </main>

        <footer className="relative z-10 border-t border-yellow-500/30 bg-black/60 backdrop-blur-md py-8 text-center">
          <p className="text-lg text-yellow-200 font-bold">© 2026 WLD Lotto Platform</p>
        </footer>

        <style>{`
          @keyframes float-neon {
            0%, 100% {
              transform: translateY(0px);
              border-color: rgba(255, 100, 100, 0.7);
            }
            25% {
              transform: translateY(-8px);
              border-color: rgba(255, 150, 150, 0.9);
            }
            50% {
              transform: translateY(0px);
              border-color: rgba(255, 100, 100, 0.5);
            }
            75% {
              transform: translateY(-8px);
              border-color: rgba(255, 150, 150, 0.9);
            }
          }
          
          .animate-float-neon {
            animation: float-neon 2.6s ease-in-out infinite;
          }

          .animate-button-color-breathe {
            /* Animation removed - button stays on */
          }

          @keyframes green-border-pulse {
            0%, 100% {
              border-color: rgba(200, 200, 200, 0.8);
            }
            25% {
              border-color: rgba(100, 220, 120, 0.6);
            }
            50% {
              border-color: rgba(200, 200, 200, 0.6);
            }
            75% {
              border-color: rgba(100, 220, 120, 0.4);
            }
          }
          
          .animate-green-border-pulse {
            animation: float-neon 2.6s ease-in-out infinite, green-border-pulse 2.6s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // 구입 화면
  if (currentStep === "purchase") {
    return (
      <div
        className="min-h-screen w-full relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://cdn.manus.space/lotto_background_theater_lights.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(2.5) contrast(1.3) saturate(1.2)',
        }}
      >
        <div className="fixed inset-0 bg-black/10 pointer-events-none" />

        <header className="sticky top-0 z-50 w-full bg-black/70 backdrop-blur-md border-b border-yellow-500/40">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep("home")}
              className="text-2xl hover:scale-110 transition-transform text-yellow-400 font-bold"
            >
              ← 돌아가기
            </button>
            <h1 className="text-2xl font-black text-yellow-400">지갑 주소</h1>
            <div className="w-8" />
          </div>
        </header>

        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
          <Card className="w-full max-w-md bg-black/70 border-yellow-500/50 backdrop-blur-md">
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <p className="text-yellow-300 font-bold">월드코인 송금 주소</p>
                <p className="text-2xl font-black text-yellow-400">0x1234...5678</p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="w-full h-48 bg-black/50 rounded flex items-center justify-center text-yellow-300">
                  [QR 코드]
                </div>
              </div>

              <button
                onClick={() => {
                  setHasTransferred(true);
                  setCurrentStep("home");
                }}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-all"
              >
                송금 완료
              </button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // 번호 선택 화면
  if (currentStep === "numbers") {
    return (
      <div
        className="min-h-screen w-full relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://cdn.manus.space/lotto_background_theater_lights.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(2.5) contrast(1.3) saturate(1.2)',
        }}
      >
        <div className="fixed inset-0 bg-black/10 pointer-events-none" />

        <header className="sticky top-0 z-50 w-full bg-black/70 backdrop-blur-md border-b border-yellow-500/40">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep("home")}
              className="text-2xl hover:scale-110 transition-transform text-yellow-400 font-bold"
            >
              ← 돌아가기
            </button>
            <h1 className="text-2xl font-black text-yellow-400">번호 선택</h1>
            <div className="w-8" />
          </div>
        </header>

        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
          <Card className="w-full max-w-2xl bg-black/70 border-yellow-500/50 backdrop-blur-md">
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <p className="text-yellow-300 font-bold">1~45번 중 6개를 선택하세요</p>
                <p className="text-lg text-yellow-400 font-bold">선택: {selectedNumbers.length}/6</p>
              </div>

              <div className="grid grid-cols-6 gap-2 sm:gap-3">
                {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => toggleNumber(num)}
                    className={`w-full aspect-square rounded-lg font-bold text-sm sm:text-base transition-all ${
                      selectedNumbers.includes(num)
                        ? 'bg-yellow-500 text-black scale-105'
                        : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/40'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentStep("home")}
                disabled={selectedNumbers.length !== 6}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  selectedNumbers.length === 6
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                응모 완료
              </button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return null;
}
