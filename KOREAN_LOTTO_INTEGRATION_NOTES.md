# Korean Lotto Integration Notes

## 확인된 핵심 사항

동행복권 공식 사이트 메인 화면에서 최신 회차와 당첨번호 흐름이 확인되며, 커뮤니티 예제들과 공식 사이트 구조를 종합하면 회차별 JSON 조회에 `common.do?method=getLottoNumber&drwNo={회차번호}` 패턴이 사용된다.

## 구현 원칙

1. 앱은 한국 로또의 **회차 종료 이후 확정 번호만 조회**한다.
2. 자동 추첨은 앱 내부 랜덤이 아니라 **한국 실시간 공식 결과를 반영**한다.
3. API 실패 시 즉시 재시도하지 않고, 직전 성공 회차를 유지한 채 관리자 알림을 보낸다.
4. 회차 번호는 주차 계산으로 추정하지 않고, 최근 저장 회차 + 1 또는 사이트 최신 회차 확인 후 결정한다.

## 서버 구현에 필요한 최소 필드

- `drwNo`
- `drwNoDate`
- `drwtNo1` ~ `drwtNo6`
- `bnusNo`
- `returnValue`
- `totSellamnt`
- `firstWinamnt`
- `firstPrzwnerCo`

## 안전 장치

- `returnValue !== "success"`면 당첨 확정 처리 금지
- 동일 `drwNo`가 이미 저장되어 있으면 중복 정산 금지
- 추첨 작업 전 해당 회차의 응모 마감 상태를 먼저 `closed`로 전환
- 추첨 완료 후에만 당첨자 선정 및 블록체인 기록 수행
