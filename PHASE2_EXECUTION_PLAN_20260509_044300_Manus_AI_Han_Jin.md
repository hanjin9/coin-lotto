# 🚀 Web3 Lotto Phase 2 - 실행 계획서

**작성일:** 2026-05-09 04:43:00 UTC  
**작성자:** Manus AI (Han Jin)  
**목적:** 오픈소스 하이재킹 + 핵심 기능 모듈 이식 실행 계획  
**상태:** ✅ 준비 완료 (즉시 실행 가능)

---

## 📋 현재 상태

### ✅ 완료된 작업
1. **전략 기획서 분석** (OPENSOURCE_HIJACKING_STRATEGY)
   - 로그인 API 복잡성 우회 전략 수립
   - 오픈소스 하이재킹 방식 정의
   - 예상 효과: 69% 시간 절감

2. **핵심 기능 모듈 식별** (CORE_MODULES_ANALYSIS)
   - 6가지 핵심 모듈 분석
   - 각 모듈별 최적 오픈소스 선정
   - 구현 코드 샘플 제공

3. **우선순위 결정**
   - 1순위: 로또 게임 엔진 (필수)
   - 2순위: 알림 시스템 (중요)
   - 3순위: 관리자 기능 (선택)

---

## 🎯 Phase 2 목표

```
로그인 미연기
    ↓
오픈소스 '하이재킹'
    ↓
핵심 기능 모듈 이식
    ↓
완벽한 통합 테스트
    ↓
Phase 2 완성 (로또 게임 메커니즘)
```

---

## 📦 필요한 패키지 설치

### 1단계: 필수 패키지 설치
```bash
cd /home/ubuntu/coin-lotto

# 필수 패키지
npm install big.js          # 정확한 금액 계산
npm install nodemailer      # 이메일 발송
npm install twilio          # SMS 발송
npm install zod             # 데이터 검증
npm install date-fns        # 날짜 처리

# 이미 설치된 것 확인
npm list ethers.js
npm list recharts
npm list lodash
npm list hardhat
```

### 2단계: 환경변수 설정
```bash
# .env.local 에 추가
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

STRIPE_API_KEY=your-stripe-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
```

---

## 🛠️ Phase 2 작업 계획 (병렬 진행)

### 📅 일정: 5-7일 (병렬 작업)

### 🎲 작업 1: 로또 게임 엔진 (1-2일)

**담당:** 모듈 1 팀  
**파일:** `server/modules/lottery-engine.ts`

#### 1-1. 난수 생성 모듈
```typescript
// server/modules/lottery-engine.ts
- generateLotteryNumbers()      // 난수 생성
- validateLotteryNumbers()      // 번호 검증
- countMatches()                // 일치 개수 확인
```

**테스트:**
```bash
pnpm test server/modules/lottery-engine.test.ts
```

#### 1-2. 당첨자 선정 모듈
```typescript
// server/modules/winner-selector.ts
- selectWinners()               // 당첨자 선정
- classifyByGrade()             // 등급 분류
```

**테스트:**
```bash
pnpm test server/modules/winner-selector.test.ts
```

#### 1-3. 상금 계산 모듈
```typescript
// server/modules/prize-calculator.ts
- calculatePrizeDistribution()  // 상금 배분
- calculateTax()                // 세금 계산
- calculateNetAmount()          // 순 금액 계산
```

**테스트:**
```bash
pnpm test server/modules/prize-calculator.test.ts
```

#### 체크리스트
- [ ] 난수 생성 모듈 구현
- [ ] 당첨자 선정 모듈 구현
- [ ] 상금 계산 모듈 구현
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] 성능 테스트
- [ ] 코드 검수

---

### 📧 작업 2: 알림 시스템 (1-2일)

**담당:** 모듈 2 팀  
**파일:** `server/modules/notification-system.ts`

#### 2-1. 이메일 알림 모듈
```typescript
// server/modules/email-notifier.ts
- notifyWinner()                // 당첨자 알림
- notifyTransaction()           // 거래 확인
- notifyPasswordReset()         // 비밀번호 재설정
```

**테스트:**
```bash
pnpm test server/modules/email-notifier.test.ts
```

#### 2-2. SMS 알림 모듈
```typescript
// server/modules/sms-notifier.ts
- notifyWinnerSMS()             // SMS 당첨자 알림
- notifyTransactionSMS()        // SMS 거래 확인
```

**테스트:**
```bash
pnpm test server/modules/sms-notifier.test.ts
```

#### 체크리스트
- [ ] 이메일 알림 모듈 구현
- [ ] SMS 알림 모듈 구현
- [ ] 템플릿 작성
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] 실제 발송 테스트

---

### ⛓️ 작업 3: 블록체인 연동 (2-3일)

**담당:** 모듈 3 팀  
**파일:** `server/modules/blockchain-integration.ts`

#### 3-1. 스마트 컨트랙트 배포
```typescript
// scripts/deploy-lottery-contract.ts
- deployLotteryContract()       // 컨트랙트 배포
- verifyContract()              // 컨트랙트 검증
- saveContractInfo()            // 배포 정보 저장
```

#### 3-2. 블록체인 상호작용
```typescript
// server/modules/blockchain-integration.ts
- recordDrawOnChain()           // 추첨 결과 기록
- verifyWinnerOnChain()         // 당첨자 검증
- claimPrizeOnChain()           // 상금 청구
- getDrawResultOnChain()        // 추첨 결과 조회
```

**테스트:**
```bash
pnpm test server/modules/blockchain-integration.test.ts
```

#### 체크리스트
- [ ] 스마트 컨트랙트 배포
- [ ] 블록체인 상호작용 모듈 구현
- [ ] 거래 추적 모듈 구현
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] Sepolia 테스트넷 테스트

---

### 📊 작업 4: 통합 및 테스트 (2-3일)

**담당:** 통합 팀  
**파일:** `server/e2e-integration.test.ts`

#### 4-1. 전체 플로우 통합
```typescript
// server/e2e-integration.test.ts
- 응모권 구매 → 추첨 → 당첨자 선정 → 알림 → 블록체인 기록
```

#### 4-2. 성능 테스트
```bash
pnpm test:performance
```

#### 4-3. 부하 테스트
```bash
pnpm test:load
```

#### 체크리스트
- [ ] E2E 통합 테스트 작성
- [ ] 성능 테스트 실행
- [ ] 부하 테스트 실행
- [ ] 에러 처리 테스트
- [ ] 보안 테스트
- [ ] 문서화

---

## 📂 파일 구조 (생성될 파일)

```
server/
├── modules/
│   ├── lottery-engine.ts              # 로또 게임 엔진
│   ├── lottery-engine.test.ts         # 테스트
│   ├── winner-selector.ts             # 당첨자 선정
│   ├── winner-selector.test.ts        # 테스트
│   ├── prize-calculator.ts            # 상금 계산
│   ├── prize-calculator.test.ts       # 테스트
│   ├── email-notifier.ts              # 이메일 알림
│   ├── email-notifier.test.ts         # 테스트
│   ├── sms-notifier.ts                # SMS 알림
│   ├── sms-notifier.test.ts           # 테스트
│   ├── blockchain-integration.ts      # 블록체인 연동
│   └── blockchain-integration.test.ts # 테스트
│
├── routers/
│   ├── lottery.ts                     # 로또 라우터
│   ├── notification.ts                # 알림 라우터
│   └── blockchain.ts                  # 블록체인 라우터
│
├── e2e-integration.test.ts            # 통합 테스트
└── performance.test.ts                # 성능 테스트

scripts/
└── deploy-lottery-contract.ts         # 배포 스크립트

contracts/
└── LotteryEngine.sol                  # 스마트 컨트랙트 (개선)
```

---

## 🧪 테스트 전략

### 1단계: 단위 테스트 (Unit Test)
```bash
# 각 모듈별 테스트
pnpm test server/modules/

# 커버리지 확인
pnpm test:coverage
```

### 2단계: 통합 테스트 (Integration Test)
```bash
# 모듈 간 통합 테스트
pnpm test:integration
```

### 3단계: E2E 테스트 (End-to-End Test)
```bash
# 전체 플로우 테스트
pnpm test:e2e
```

### 4단계: 성능 테스트 (Performance Test)
```bash
# 성능 측정
pnpm test:performance
```

---

## ✅ 완료 기준

### 1️⃣ 로또 게임 엔진
- ✅ 난수 생성 (암호화, 검증 가능)
- ✅ 당첨자 선정 (정확, 빠름)
- ✅ 상금 계산 (정확한 소수점)
- ✅ 테스트 커버리지 > 95%

### 2️⃣ 알림 시스템
- ✅ 이메일 알림 (성공률 > 99%)
- ✅ SMS 알림 (성공률 > 99%)
- ✅ 템플릿 다국어 지원
- ✅ 테스트 커버리지 > 90%

### 3️⃣ 블록체인 연동
- ✅ 스마트 컨트랙트 배포 (Sepolia)
- ✅ 추첨 결과 온체인 기록
- ✅ 당첨자 검증 (정확)
- ✅ 테스트 커버리지 > 85%

### 4️⃣ 통합 테스트
- ✅ E2E 테스트 통과
- ✅ 성능 기준 충족 (< 2초)
- ✅ 부하 테스트 통과 (1000 TPS)
- ✅ 에러 처리 완벽

---

## 📊 예상 결과

### 시간 절감
| 항목 | 기존 | 오픈소스 | 절감 |
|------|------|---------|------|
| 난수 생성 | 4시간 | 1시간 | 75% |
| 당첨자 선정 | 3시간 | 1시간 | 66% |
| 상금 계산 | 3시간 | 1시간 | 66% |
| 이메일 | 5시간 | 2시간 | 60% |
| SMS | 6시간 | 2시간 | 66% |
| 블록체인 | 8시간 | 4시간 | 50% |
| **총계** | **29시간** | **11시간** | **62%** |

### 품질 향상
- ✅ 검증된 라이브러리 사용
- ✅ 보안 입증됨
- ✅ 성능 최적화됨
- ✅ 버그 최소화
- ✅ 커뮤니티 지원

---

## 🚀 다음 단계

### Phase 2 완성 후 (7-10일)
1. ✅ 로또 게임 메커니즘 완성
2. ✅ 알림 시스템 완성
3. ✅ 블록체인 연동 완성

### Phase 3 (10-15일)
1. UI 개발 (로또 구매, 결과 조회)
2. 관리자 대시보드
3. 사용자 마이페이지

### Phase 4 (15-20일)
1. 배포 준비
2. 보안 감사
3. 성능 최적화

---

## 📞 즉시 실행 명령어

```bash
# 1. 프로젝트 디렉토리로 이동
cd /home/ubuntu/coin-lotto

# 2. 필수 패키지 설치
npm install big.js nodemailer twilio zod date-fns

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 수정

# 4. 개발 서버 실행
pnpm dev

# 5. 테스트 실행
pnpm test

# 6. 작업 시작
# 각 팀이 담당 모듈 구현
```

---

## 📋 최종 체크리스트

- [x] 전략 기획서 작성
- [x] 핵심 기능 모듈 분석
- [x] 오픈소스 선정
- [x] 파일 구조 설계
- [x] 테스트 전략 수립
- [ ] 패키지 설치 (다음 단계)
- [ ] 환경변수 설정 (다음 단계)
- [ ] 모듈 구현 (다음 단계)
- [ ] 테스트 작성 (다음 단계)
- [ ] 통합 테스트 (다음 단계)

---

## ✨ 준비 완료!

**모든 준비가 완료되었습니다.**

**즉시 시작할 수 있습니다:**
1. 패키지 설치
2. 환경변수 설정
3. 모듈 구현
4. 테스트 작성
5. 통합 테스트

**예상 완료:** 5-7일 (병렬 작업)

---

**문서 작성:** 2026-05-09 04:43:00 UTC  
**작성자:** Manus AI (Han Jin)  
**버전:** 1.0 (실행 계획)  
**상태:** ✅ 준비 완료 (즉시 실행 가능)
