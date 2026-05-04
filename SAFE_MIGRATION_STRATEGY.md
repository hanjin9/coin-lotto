# Safe Migration Strategy

## 원칙

이번 전환은 **rename/drop 중심이 아니라 additive-first** 방식으로 진행한다. 즉, 기존 `lottery_tickets`, `lottery_results`, `lottery_snapshots`, `transactions`, `users` 데이터를 최대한 보존하고, 신규 구조는 **추가 테이블 생성 + 추가 컬럼 확장 + 점진적 코드 전환** 순서로 적용한다.

## drizzle-kit 기본 generate를 바로 적용하지 않는 이유

현재 Drizzle는 신규 `admin_logs` 등을 기존 테이블 rename 후보로 해석하고 있다. 이 상태에서 자동 생성 SQL을 그대로 사용하면 다음 위험이 있다.

| 위험 | 설명 |
|------|------|
| 오인 rename | `lottery_results`, `lottery_snapshots`, `lottery_tickets` 등이 새 테이블로 rename 제안될 수 있음 |
| 코드 즉시 붕괴 | 기존 서버 코드가 여전히 legacy 테이블명을 사용하므로 즉시 런타임 오류 발생 가능 |
| 데이터 의미 손상 | `transactions.hash/from/to/value` 구조와 v2 `txHash/amount/currency/userId` 구조는 의미가 다름 |

## 안전한 3단계 전략

### 1단계: Legacy 유지 + 신규 구조 병행 생성

아래는 **바로 실행 가능한 안전 우선안**이다.

| 대상 | 방식 |
|------|------|
| `users` | 컬럼 추가만 수행 |
| `transactions` | 신규 컬럼 추가만 수행 |
| `lottery_winners` | 신규 컬럼 추가만 수행 |
| `draws` | 신규 생성 |
| `tickets` | 신규 생성 |
| `verification_codes` | 신규 생성 |
| `payment_statistics` | 신규 생성 |
| `admin_logs` | 신규 생성 |
| 기존 `lottery_*` 테이블 | 유지 |

### 2단계: 서버 코드 이중 호환

서버 코드가 우선 **legacy 읽기 + new 쓰기** 또는 반대로 동작하도록 호환층을 만든다. 이 단계에서 `db-crud.ts`, `worldcoin-payment.ts`, `deposit-to-ticket.ts`, `statistics router`를 순차적으로 교체한다.

### 3단계: 데이터 이관 완료 후 정리

운영 검증이 끝난 후에만 legacy 테이블 축소/뷰 전환/rename 여부를 검토한다. 이 단계는 현재 범위 밖이며, 절대 선행하지 않는다.

## 권장 SQL 방향

### users
- `phoneNumber`
- `walletAddress`
- `preferredWalletType`
- `walletVerified`
- `status`
- `membershipTier`
- `totalTicketsPurchased`
- `totalWinnings`
- `totalLosses`

### transactions
- `userId`
- `amount`
- `currency`
- `txHash`
- `retryCount`
- `maxRetries`
- `lastRetryAt`
- `gasUsed`
- `errorMessage`

단, 기존 `hash`, `from`, `to`, `value`는 당분간 유지한다.

### lottery_winners
- `prizeRank`
- `claimStatus`
- `claimTxHash`
- `taxAmount`
- `netAmount`
- `updatedAt`

## 즉시 후속 작업

1. `worldcoin-payment.ts`를 legacy+v2 호환 구조로 수정한다.
2. `db-crud.ts`를 신규 `tickets/draws` 기준이 아니라 **safe bridge layer**로 다시 작성한다.
3. 그 뒤 custom migration SQL을 작성한다.

## 결론

현재 최적 해법은 **자동 migration 강행이 아니라, custom SQL 기반의 점진 전환**이다. 이것이 대표님이 강조한 **안전 + 완벽** 원칙에 가장 부합한다.
