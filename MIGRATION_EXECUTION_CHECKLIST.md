# Migration Execution Checklist

## 목적

이 문서는 `0003_safe_v2_additive.sql` 적용 전에 반드시 확인해야 할 안전 절차를 정리한다. 현재 프로젝트는 코드 정합성은 확보되었으나, 실제 데이터베이스 테이블 적용 전이므로 런타임 검증은 아직 완료되지 않았다.

## 적용 전 확인

| 항목 | 확인 내용 | 상태 |
|------|-----------|------|
| 백업 체크포인트 | `df3484df`가 존재하는가 | 완료 |
| TypeScript | 0 errors 상태인가 | 완료 |
| 개발 서버 | 재시작 후 정상 기동하는가 | 완료 |
| migration 전략 | additive-first 원칙이 문서화되었는가 | 완료 |
| destructive 변경 | DROP/rename 강행 SQL이 없는가 | 확인 필요 |
| DB 적용 권한 | 실제 SQL 적용 수단이 준비되었는가 | 확인 필요 |

## 적용 순서

우선 `users`, `transactions`, `lottery_winners`의 additive 컬럼 추가부터 적용한다. 그 다음 `draws`, `tickets`, `verification_codes`, `payment_statistics`, `admin_logs`를 생성한다. 마지막으로 legacy compatibility table과 신규 코드의 공존 상태를 점검한다.

## 적용 직후 검증

| 검증 항목 | 기대 결과 |
|----------|-----------|
| `transactions` 조회 | 테이블 존재, `txHash`/`amount`/`userId` 컬럼 확인 |
| `draws` 조회 | 신규 회차 저장 가능 |
| `tickets` 조회 | `drawId` 포함 상태로 응모권 저장 가능 |
| `payment_statistics` 조회 | 통계 집계 저장 가능 |
| E2E 테스트 | 기존 DB 없음 오류가 사라져야 함 |

## 실패 시 대응

적용 실패 시 즉시 추가 변경을 중단하고, 실패한 SQL 문과 영향 범위를 기록한 뒤 체크포인트 기준으로 롤백 판단을 내린다. 안전 원칙상, 마이그레이션 실패 상태에서 후속 기능 개발을 밀어붙이면 안 된다.
