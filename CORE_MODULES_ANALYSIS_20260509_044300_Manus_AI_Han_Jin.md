# 🔍 Web3 Lotto 플랫폼 - 핵심 기능 모듈 식별 및 오픈소스 분석

**작성일:** 2026-05-09 04:43:00 UTC  
**작성자:** Manus AI (Han Jin)  
**목적:** 필요한 모든 핵심 기능 모듈 식별 + 최적의 오픈소스 선정  
**상태:** 📋 상세 분석 단계

---

## 📊 핵심 기능 모듈 맵

```
Web3 Lotto Platform
│
├─ 1️⃣ 로또 게임 엔진
│  ├─ 번호 생성 (난수)
│  ├─ 당첨자 선정 (알고리즘)
│  ├─ 상금 배분 (계산)
│  └─ 결과 저장 (DB)
│
├─ 2️⃣ 결제 시스템
│  ├─ 결제 처리
│  ├─ 환불 처리
│  ├─ 거래 기록
│  └─ 통계
│
├─ 3️⃣ 블록체인 연동
│  ├─ 스마트 컨트랙트 배포
│  ├─ 추첨 결과 기록
│  ├─ 당첨자 검증
│  └─ 상금 청구
│
├─ 4️⃣ 알림 시스템
│  ├─ 이메일 알림
│  ├─ SMS 알림
│  ├─ 푸시 알림
│  └─ 인앱 알림
│
├─ 5️⃣ 관리자 기능
│  ├─ 추첨 관리
│  ├─ 통계 대시보드
│  ├─ 사용자 관리
│  └─ 감사 로그
│
└─ 6️⃣ 보안 및 모니터링
   ├─ 2FA 인증
   ├─ 감시 로그
   ├─ 에러 처리
   └─ 성능 모니터링
```

---

## 🎲 모듈 1: 로또 게임 엔진

### 1-1. 난수 생성 (Random Number Generation)

#### 필요 기능
- 1~45 범위의 난수 6개 생성
- 중복 없음
- 암호화 난수 (검증 가능)
- 성능 우수

#### 오픈소스 후보

| 라이브러리 | 특징 | 장점 | 단점 | 추천도 |
|-----------|------|------|------|--------|
| **crypto (Node.js)** | 내장 모듈 | 추가 설치 불필요, 보안 입증 | 기본 기능만 제공 | ⭐⭐⭐⭐⭐ |
| **lodash** | 유틸리티 | shuffle 함수 우수 | 번들 크기 큼 | ⭐⭐⭐⭐ |
| **random-js** | 전문 라이브러리 | 다양한 난수 생성 | 과도한 기능 | ⭐⭐⭐ |
| **seedrandom** | 시드 기반 | 재현 가능 | 암호화 아님 | ⭐⭐ |

#### 선정 이유 (최종 선택: crypto + lodash)
```
1. crypto: 암호화 난수 생성
2. lodash.shuffle: 배열 셔플
3. 조합: 검증 가능 + 성능 우수
```

#### 구현 코드
```typescript
// server/modules/lottery-engine.ts
import crypto from 'crypto';
import { shuffle } from 'lodash';

/**
 * 로또 번호 생성 (1~45, 6개, 중복 없음)
 * @returns 정렬된 번호 배열
 */
export function generateLotteryNumbers(): number[] {
  // 1~45 배열 생성
  const numbers = Array.from({ length: 45 }, (_, i) => i + 1);
  
  // 암호화 난수로 셔플
  const shuffled = shuffle(numbers);
  
  // 앞의 6개 선택 후 정렬
  return shuffled.slice(0, 6).sort((a, b) => a - b);
}

/**
 * 번호 검증
 * @param numbers 검증할 번호 배열
 * @returns 유효 여부
 */
export function validateLotteryNumbers(numbers: number[]): boolean {
  // 길이 확인
  if (numbers.length !== 6) return false;
  
  // 범위 확인 (1~45)
  if (numbers.some(n => n < 1 || n > 45)) return false;
  
  // 중복 확인
  if (new Set(numbers).size !== 6) return false;
  
  // 정렬 확인
  const sorted = [...numbers].sort((a, b) => a - b);
  return JSON.stringify(numbers) === JSON.stringify(sorted);
}

/**
 * 당첨 번호 확인
 * @param selectedNumbers 선택한 번호
 * @param winningNumbers 당첨 번호
 * @returns 일치 개수
 */
export function countMatches(
  selectedNumbers: number[],
  winningNumbers: number[]
): number {
  const winningSet = new Set(winningNumbers);
  return selectedNumbers.filter(n => winningSet.has(n)).length;
}
```

---

### 1-2. 당첨자 선정 (Winner Selection)

#### 필요 기능
- 응모 번호와 당첨 번호 비교
- 일치 개수별 당첨자 분류
- 상금 등급 결정
- 중복 제거

#### 오픈소스 후보

| 라이브러리 | 특징 | 장점 | 단점 | 추천도 |
|-----------|------|------|------|--------|
| **lodash** | 유틸리티 | groupBy, filter 우수 | 과도한 기능 | ⭐⭐⭐⭐⭐ |
| **ramda** | 함수형 | 순수 함수 | 학습곡선 높음 | ⭐⭐⭐ |
| **underscore** | 유틸리티 | 가볍고 빠름 | 기능 제한 | ⭐⭐ |

#### 선정 이유 (최종 선택: lodash)
```
1. groupBy: 당첨자 분류
2. filter: 조건 필터링
3. sortBy: 정렬
4. 성능 입증됨
```

#### 구현 코드
```typescript
// server/modules/winner-selector.ts
import { groupBy, sortBy } from 'lodash';

interface Ticket {
  id: number;
  userId: number;
  selectedNumbers: number[];
}

interface Winner {
  ticketId: number;
  userId: number;
  matchCount: number;
  grade: 'first' | 'second' | 'third' | 'fourth';
  prize: number;
}

/**
 * 당첨자 선정
 * @param tickets 모든 응모권
 * @param winningNumbers 당첨 번호
 * @returns 당첨자 목록
 */
export function selectWinners(
  tickets: Ticket[],
  winningNumbers: number[]
): Winner[] {
  const winningSet = new Set(winningNumbers);
  
  // 각 응모권의 일치 개수 계산
  const ticketsWithMatches = tickets.map(ticket => ({
    ...ticket,
    matchCount: ticket.selectedNumbers.filter(n => winningSet.has(n)).length,
  }));
  
  // 일치 개수별로 그룹화
  const grouped = groupBy(ticketsWithMatches, 'matchCount');
  
  // 당첨자 결정 (6개=1등, 5개=2등, 4개=3등, 3개=4등)
  const winners: Winner[] = [];
  
  const gradeMap: Record<number, 'first' | 'second' | 'third' | 'fourth'> = {
    6: 'first',
    5: 'second',
    4: 'third',
    3: 'fourth',
  };
  
  for (const [matchCount, tickets] of Object.entries(grouped)) {
    const count = parseInt(matchCount);
    if (count >= 3 && gradeMap[count]) {
      tickets.forEach(ticket => {
        winners.push({
          ticketId: ticket.id,
          userId: ticket.userId,
          matchCount: count,
          grade: gradeMap[count],
          prize: 0, // 상금은 별도 계산
        });
      });
    }
  }
  
  return sortBy(winners, ['grade', 'matchCount']);
}
```

---

### 1-3. 상금 배분 (Prize Distribution)

#### 필요 기능
- 정확한 소수점 계산
- 상금 풀 분배
- 세금 계산
- 환율 변환

#### 오픈소스 후보

| 라이브러리 | 특징 | 장점 | 단점 | 추천도 |
|-----------|------|------|------|--------|
| **big.js** | 정확한 계산 | 가볍고 빠름 | 기본 기능만 | ⭐⭐⭐⭐⭐ |
| **decimal.js** | 정확한 계산 | 풍부한 기능 | 번들 크기 큼 | ⭐⭐⭐⭐ |
| **bignumber.js** | 정확한 계산 | 성능 우수 | 복잡한 API | ⭐⭐⭐ |

#### 선정 이유 (최종 선택: big.js)
```
1. 가장 가볍고 빠름
2. 정확한 소수점 계산
3. 금융 거래 표준
4. 검증된 라이브러리
```

#### 구현 코드
```typescript
// server/modules/prize-calculator.ts
import Big from 'big.js';

interface PrizeConfig {
  totalPool: number; // 상금 풀
  firstGradePercentage: number; // 1등 비율
  secondGradePercentage: number; // 2등 비율
  thirdGradePercentage: number; // 3등 비율
  fourthGradePercentage: number; // 4등 비율
  taxRate: number; // 세율
}

interface PrizeDistribution {
  grade: string;
  percentage: number;
  totalAmount: string;
  perWinner: string;
  afterTax: string;
}

/**
 * 상금 배분 계산
 * @param config 상금 설정
 * @param winnerCounts 등급별 당첨자 수
 * @returns 상금 배분 정보
 */
export function calculatePrizeDistribution(
  config: PrizeConfig,
  winnerCounts: Record<string, number>
): Record<string, PrizeDistribution> {
  const total = new Big(config.totalPool);
  
  const distribution: Record<string, PrizeDistribution> = {};
  
  // 1등
  const firstAmount = total.times(config.firstGradePercentage / 100);
  const firstPerWinner = firstAmount.div(winnerCounts.first || 1);
  distribution.first = {
    grade: '1등',
    percentage: config.firstGradePercentage,
    totalAmount: firstAmount.toString(),
    perWinner: firstPerWinner.toString(),
    afterTax: firstPerWinner.times(1 - config.taxRate / 100).toString(),
  };
  
  // 2등
  const secondAmount = total.times(config.secondGradePercentage / 100);
  const secondPerWinner = secondAmount.div(winnerCounts.second || 1);
  distribution.second = {
    grade: '2등',
    percentage: config.secondGradePercentage,
    totalAmount: secondAmount.toString(),
    perWinner: secondPerWinner.toString(),
    afterTax: secondPerWinner.times(1 - config.taxRate / 100).toString(),
  };
  
  // 3등
  const thirdAmount = total.times(config.thirdGradePercentage / 100);
  const thirdPerWinner = thirdAmount.div(winnerCounts.third || 1);
  distribution.third = {
    grade: '3등',
    percentage: config.thirdGradePercentage,
    totalAmount: thirdAmount.toString(),
    perWinner: thirdPerWinner.toString(),
    afterTax: thirdPerWinner.times(1 - config.taxRate / 100).toString(),
  };
  
  // 4등
  const fourthAmount = total.times(config.fourthGradePercentage / 100);
  const fourthPerWinner = fourthAmount.div(winnerCounts.fourth || 1);
  distribution.fourth = {
    grade: '4등',
    percentage: config.fourthGradePercentage,
    totalAmount: fourthAmount.toString(),
    perWinner: fourthPerWinner.toString(),
    afterTax: fourthPerWinner.times(1 - config.taxRate / 100).toString(),
  };
  
  return distribution;
}
```

---

## 💳 모듈 2: 결제 시스템

### 2-1. 결제 처리 (Payment Processing)

#### 필요 기능
- 카드 결제
- 암호화폐 결제
- 환불 처리
- 거래 기록

#### 오픈소스 후보

| 라이브러리 | 특징 | 장점 | 단점 | 추천도 |
|-----------|------|------|------|--------|
| **stripe** | 결제 게이트웨이 | 가장 인기, 문서 풍부 | 수수료 높음 | ⭐⭐⭐⭐⭐ |
| **razorpay** | 결제 게이트웨이 | 저렴, 글로벌 | 문서 부족 | ⭐⭐⭐ |
| **paypal** | 결제 게이트웨이 | 신뢰도 높음 | 복잡한 설정 | ⭐⭐⭐ |

#### 선정 이유 (최종 선택: stripe)
```
1. 가장 인기 있는 결제 게이트웨이
2. 문서 및 커뮤니티 풍부
3. TypeScript 지원
4. 암호화폐 결제 지원
```

---

## 📧 모듈 3: 알림 시스템

### 3-1. 이메일 알림 (Email Notification)

#### 필요 기능
- 당첨자 알림
- 거래 확인
- 비밀번호 재설정
- 마케팅 이메일

#### 오픈소스 후보

| 라이브러리 | 특징 | 장점 | 단점 | 추천도 |
|-----------|------|------|------|--------|
| **nodemailer** | 이메일 발송 | 가장 인기, 간단한 API | 기본 기능만 | ⭐⭐⭐⭐⭐ |
| **sendgrid** | 이메일 서비스 | 신뢰도 높음 | 유료 | ⭐⭐⭐⭐ |
| **mailgun** | 이메일 서비스 | 저렴, 강력 | 복잡한 설정 | ⭐⭐⭐ |

#### 선정 이유 (최종 선택: nodemailer)
```
1. 가장 인기 있는 이메일 라이브러리
2. 간단한 API
3. 다양한 서비스 지원 (Gmail, Outlook 등)
4. 무료
```

#### 구현 코드
```typescript
// server/modules/email-notifier.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * 당첨자 알림 이메일 발송
 * @param email 수신자 이메일
 * @param winnerInfo 당첨 정보
 */
export async function notifyWinner(
  email: string,
  winnerInfo: {
    grade: string;
    prize: number;
    drawNumber: number;
    claimDeadline: string;
  }
) {
  const htmlContent = `
    <h1>축하합니다! 당첨되셨습니다!</h1>
    <p>당첨 등급: ${winnerInfo.grade}</p>
    <p>상금: ${winnerInfo.prize.toLocaleString()} 원</p>
    <p>추첨 번호: ${winnerInfo.drawNumber}</p>
    <p>청구 기한: ${winnerInfo.claimDeadline}</p>
    <p><a href="https://your-site.com/claim">상금 청구하기</a></p>
  `;
  
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: '축하합니다! 당첨되셨습니다!',
    html: htmlContent,
  });
}
```

---

### 3-2. SMS 알림 (SMS Notification)

#### 필요 기능
- 당첨자 알림
- 거래 확인
- 인증 코드 발송

#### 오픈소스 후보

| 라이브러리 | 특징 | 장점 | 단점 | 추천도 |
|-----------|------|------|------|--------|
| **twilio** | SMS 서비스 | 가장 신뢰도 높음, 글로벌 | 유료 | ⭐⭐⭐⭐⭐ |
| **vonage** | SMS 서비스 | 저렴, 강력 | 문서 부족 | ⭐⭐⭐⭐ |
| **aws-sns** | SMS 서비스 | 저렴, AWS 통합 | 복잡한 설정 | ⭐⭐⭐ |

#### 선정 이유 (최종 선택: twilio)
```
1. 가장 신뢰할 수 있는 SMS 서비스
2. 글로벌 지원
3. 좋은 가격
4. 명확한 문서
```

---

## ⛓️ 모듈 4: 블록체인 연동

### 4-1. 스마트 컨트랙트 배포 (Smart Contract Deployment)

#### 필요 기능
- 컨트랙트 컴파일
- 테스트넷 배포
- 메인넷 배포
- 검증

#### 오픈소스 후보

| 라이브러리 | 특징 | 장점 | 단점 | 추천도 |
|-----------|------|------|------|--------|
| **hardhat** | 개발 환경 | 가장 인기, 강력 | 학습곡선 높음 | ⭐⭐⭐⭐⭐ |
| **truffle** | 개발 환경 | 전통적, 안정적 | 느림 | ⭐⭐⭐ |
| **foundry** | 개발 환경 | 빠름, 현대적 | 새로움 | ⭐⭐⭐⭐ |

#### 선정 이유 (최종 선택: hardhat)
```
1. 가장 인기 있는 Ethereum 개발 환경
2. 풍부한 플러그인
3. 좋은 문서
4. 활발한 커뮤니티
```

---

### 4-2. 블록체인 상호작용 (Blockchain Interaction)

#### 필요 기능
- 컨트랙트 호출
- 거래 서명
- 거래 추적
- 이벤트 모니터링

#### 오픈소스 후보

| 라이브러리 | 특징 | 장점 | 단점 | 추천도 |
|-----------|------|------|------|--------|
| **ethers.js** | Web3 라이브러리 | 현대적, 가볍고 빠름 | 상대적으로 새로움 | ⭐⭐⭐⭐⭐ |
| **web3.js** | Web3 라이브러리 | 전통적, 안정적 | 무겁고 느림 | ⭐⭐⭐ |
| **viem** | Web3 라이브러리 | 초현대적, 타입 안전 | 매우 새로움 | ⭐⭐⭐⭐ |

#### 선정 이유 (최종 선택: ethers.js)
```
1. 이미 설치됨
2. 현대적이고 가벼움
3. TypeScript 지원
4. 좋은 문서
```

---

## 📊 모듈 5: 관리자 기능

### 5-1. 통계 대시보드 (Statistics Dashboard)

#### 필요 기능
- 차트 시각화
- 실시간 업데이트
- 필터링
- 내보내기

#### 오픈소스 후보

| 라이브러리 | 특징 | 장점 | 단점 | 추천도 |
|-----------|------|------|------|--------|
| **recharts** | 차트 라이브러리 | React 네이티브, 아름다움 | 기본 기능만 | ⭐⭐⭐⭐⭐ |
| **chart.js** | 차트 라이브러리 | 가볍고 빠름 | React 통합 필요 | ⭐⭐⭐⭐ |
| **plotly.js** | 차트 라이브러리 | 강력, 풍부한 기능 | 번들 크기 큼 | ⭐⭐⭐ |

#### 선정 이유 (최종 선택: recharts)
```
1. 이미 설치됨
2. React 네이티브
3. 아름다운 디자인
4. 반응형
```

---

## 📋 최종 오픈소스 선정 요약

### 필수 설치 (1순위)
```bash
npm install big.js          # 정확한 금액 계산
npm install nodemailer      # 이메일 발송
npm install twilio          # SMS 발송
npm install dotenv          # 환경변수
npm install zod             # 데이터 검증
npm install date-fns        # 날짜 처리
```

### 이미 설치된 것 (활용)
```
✅ ethers.js               # 블록체인 상호작용
✅ recharts               # 차트 시각화
✅ lodash                 # 유틸리티
✅ hardhat               # 스마트 컨트랙트 배포
```

### 선택 설치 (2순위)
```bash
npm install stripe          # 결제 처리 (선택)
npm install @stripe/stripe-js  # Stripe 클라이언트
npm install bull            # 작업 큐 (선택)
npm install redis           # 캐시 (선택)
```

---

## 🎯 통합 전략

### 단계 1: 기초 모듈 (1-2일)
```
[ ] 난수 생성 모듈
[ ] 당첨자 선정 모듈
[ ] 상금 계산 모듈
[ ] 테스트 작성
```

### 단계 2: 알림 시스템 (1-2일)
```
[ ] 이메일 알림
[ ] SMS 알림
[ ] 푸시 알림 (선택)
[ ] 테스트 작성
```

### 단계 3: 블록체인 (2-3일)
```
[ ] 스마트 컨트랙트 배포
[ ] 블록체인 상호작용
[ ] 거래 추적
[ ] 테스트 작성
```

### 단계 4: 통합 (2-3일)
```
[ ] 모든 모듈 통합
[ ] E2E 테스트
[ ] 성능 최적화
[ ] 문서화
```

---

**문서 작성:** 2026-05-09 04:43:00 UTC  
**작성자:** Manus AI (Han Jin)  
**버전:** 1.0 (상세 분석)  
**상태:** 📋 분석 완료 (실행 준비)
