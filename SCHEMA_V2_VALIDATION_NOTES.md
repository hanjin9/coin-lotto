# Schema v2 Validation Notes

## 핵심 충돌 사항

| 영역 | 현재 상태 | schema-v2 상태 | 영향 |
|------|-----------|----------------|------|
| 결제 거래 필드 | `transactions.hash`, `from`, `to`, `value` 사용 | `transactions.txHash`, `amount`, `currency`, `userId` 중심 | `server/worldcoin-payment.ts` 전면 수정 필요 |
| 응모권 테이블 | 기존 `lotteryTickets` 중심 | 신규 `tickets` + `drawId` 명시 구조 | 입금→응모권 발급 로직과 추첨 로직 매핑 재작성 필요 |
| 인증 훅 | `client/src/_core/hooks/useAuth.ts`가 템플릿 기준 | `client/src/hooks/useAuth.ts` 신규 추가 | 클라이언트 인증 흐름 이중화, 라우트/권한 불일치 위험 |
| 익명 로그인 API | `verifyCode`가 임시 쿠키만 설정 | `protectedProcedure`는 프레임워크 인증 컨텍스트 사용 | 익명 로그인 후 `trpc.auth.me` 미인증 상태 가능성 높음 |
| 통계 API | `Math.random()` 기반 시뮬레이션 존재 | schema-v2에 `payment_statistics` 준비 | 실제 DB 집계로 교체 전까지 신뢰 불가 |
| 마이그레이션 경로 | `drizzle.config.ts`가 `drizzle/schema.ts` 참조 | `schema-v2.ts` 별도 파일 존재 | 안전 전환 전에는 migration 생성 불가 |

## 안전 원칙 기반 결론

현재는 **schema-v2를 바로 적용하면 안 됩니다.** 먼저 다음 순서가 필요합니다.

1. `schema-v2`를 최종 확정한다.
2. 기존 서버 코드의 필드 의존성을 모두 새 스키마 기준으로 매핑한다.
3. `drizzle/schema.ts`를 새 구조로 전환한 뒤 migration SQL을 생성한다.
4. 생성된 SQL을 검토하여 destructive 변경을 분리한다.
5. 그 다음에만 DB 적용을 진행한다.

## 우선 수정 대상 파일

| 우선순위 | 파일 | 수정 이유 |
|---------|------|----------|
| P0 | `server/worldcoin-payment.ts` | `transactions` 필드명이 완전히 달라 즉시 에러 발생 |
| P0 | `server/deposit-to-ticket.ts` | `tickets/drawId/userId` 구조에 맞춘 재매핑 필요 가능성 높음 |
| P0 | `server/db-crud.ts` | 기존 스키마와 신규 스키마가 혼재되어 있음 |
| P0 | `server/routers/auth.ts` | 익명 로그인 세션이 `protectedProcedure`와 연결되지 않음 |
| P1 | `client/src/App.tsx` | 신규 `useAuth` 대신 템플릿 기준 훅으로 통일 검토 필요 |
| P1 | `client/src/pages/AdminDashboardWithTabs.tsx` | 관리자 권한 판정 훅 통일 필요 |
| P1 | `server/routers/statistics.ts` | 시뮬레이션 데이터 제거 후 실제 집계 연결 필요 |

## 권장 전략

가장 안전한 방식은 **인증 훅 통합 → 스키마 필드명 확정 → 서버 코드 호환 패치 → migration 생성** 순서입니다.

현재 단계에서는 migration 실행보다 **호환성 정리**가 선행되어야 합니다.


## 2026-05-04 추가 검증

현재 TypeScript 기준으로는 0 오류를 달성했지만, E2E 테스트는 실제 DB 테이블(`transactions` 등)이 아직 생성되지 않아 실패했다. 따라서 현재 상태는 **코드 정합성은 확보되었으나, 실데이터 런타임 검증은 마이그레이션 적용 전 단계**라고 판단한다.

| 상태 | 판정 | 의미 |
|------|------|------|
| 컴파일 | 통과 | 코드 수준 충돌은 대부분 정리됨 |
| 개발 서버 | 정상 | 주요 import/타입 오류는 해소됨 |
| E2E 테스트 | 실패 | 실제 DB 테이블 미생성으로 런타임 검증 불가 |

안전 원칙상 다음 순서가 필요하다. 먼저 custom migration SQL을 최종 검토하고, 그다음 실제 DB에 적용한 뒤, 같은 E2E 테스트를 재실행해야 한다. 즉시 결론은 **"지금은 배포 완성 단계가 아니라, 마이그레이션 적용 직전의 안정화 단계"**이다.
