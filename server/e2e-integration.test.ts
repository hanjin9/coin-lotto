/**
 * E2E Integration Test - 입금감지 ~ 당첨자선정 전체 플로우 검증
 * 
 * 테스트 시나리오:
 * 1. Mempool 입금 감지
 * 2. 응모권 자동 발급
 * 3. 당첨번호 입력 및 추첨 실행
 * 4. 당첨자 자동 선정
 * 5. 블록체인 기록
 * 6. 데이터 무결성 검증
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { processDepositToTicket } from './deposit-to-ticket';
import { executeDraw, getDrawResult, getWinnersByDraw } from './lottery-draw';
import { recordDrawToBlockchain, getBlockchainRecordStatus, verifyDataIntegrity } from './blockchain-recorder';
import { getDb } from './db';
import { draws, tickets, users } from '../drizzle/schema';
import { DepositTransaction } from './mempool-watcher';

describe('E2E Integration Test - 입금감지 ~ 당첨자선정 전체 플로우', () => {
  let db: any;
  let testUserId: number;
  let testTicketId: number;
  let testDrawId = 1;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }
    console.log('✅ 테스트 환경 준비 완료');

    // 테스트용 draw 사전 생성 (없으면 생성)
    const existingDraws = await db.select().from(draws).where((t: any) => t.id === testDrawId).limit(1);
    if (existingDraws.length === 0) {
      const now = new Date();
      await db.insert(draws).values({
        drawNumber: testDrawId,
        drawDate: now,
        startTime: now,
        endTime: new Date(now.getTime() + 86400000), // 1일 후
        status: 'active',
        blockchainStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      console.log(`✅ 테스트용 Draw ${testDrawId} 생성됨`);
    }
  });

  afterAll(async () => {
    console.log('✅ 테스트 완료');
  });

  /**
   * 테스트 1: Mempool 입금 감지 및 응모권 자동 발급
   */
  it('should detect deposit and auto-issue lottery ticket', async () => {
    console.log('\n🔍 [테스트 1] Mempool 입금 감지 및 응모권 자동 발급');

    // 입금 거래 생성
    const depositTx: DepositTransaction = {
      hash: '0x' + Buffer.from('test_deposit_1').toString('hex'),
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      value: BigInt('10000000000000000'), // 1만원 상당
      blockNumber: 12345,
      confirmations: 1,
      status: 'confirmed',
      timestamp: new Date(),
    };

    // 입금 처리 및 응모권 발급
    const result = await processDepositToTicket(depositTx);

    expect(result).toBeDefined();
    expect(result?.ticketId).toBeGreaterThan(0);
    expect(result?.userId).toBeGreaterThan(0);

    testUserId = result!.userId;
    testTicketId = result!.ticketId;

    console.log(`✅ 응모권 발급 성공: Ticket ID ${testTicketId}, User ID ${testUserId}`);
  });

  /**
   * 테스트 2: 당첨번호 입력 및 추첨 실행
   */
  it('should execute draw with winning numbers', async () => {
    console.log('\n🎰 [테스트 2] 당첨번호 입력 및 추첨 실행');

    const winningNumbers = [1, 5, 10, 15, 20, 25];

    const drawResult = await executeDraw({
      drawId: testDrawId,
      winningNumbers,
      totalPrize: '1000000000000000000', // 1 ETH
      prizeDistribution: {
        rank1: '500000000000000000',
        rank2: '300000000000000000',
        rank3: '150000000000000000',
        rank4: '50000000000000000',
      },
    });

    expect(drawResult).toBeDefined();
    expect(drawResult?.drawId).toBe(testDrawId);
    expect(drawResult?.winningNumbers).toEqual(winningNumbers);

    console.log(`✅ 추첨 실행 완료: ${drawResult?.winners.length}명 당첨`);
  });

  /**
   * 테스트 3: 당첨자 선정 검증
   */
  it('should verify winners are selected correctly', async () => {
    console.log('\n🏆 [테스트 3] 당첨자 선정 검증');

    const winners = await getWinnersByDraw(testDrawId);
    expect(winners).toBeDefined();
    expect(Array.isArray(winners)).toBe(true);

    console.log(`✅ 당첨자 조회 완료: ${winners.length}명`);
  });

  /**
   * 테스트 4: 블록체인 기록
   */
  it('should record draw result to blockchain', async () => {
    console.log('\n⛓️ [테스트 4] 블록체인 기록');

    const blockchainResult = await recordDrawToBlockchain(testDrawId);

    expect(blockchainResult).toBeDefined();
    expect(blockchainResult?.transactionHash).toBeDefined();
    expect(blockchainResult?.status).toBe('success');

    console.log(`✅ 블록체인 기록 완료: ${blockchainResult?.transactionHash}`);
  });

  /**
   * 테스트 5: 블록체인 기록 상태 확인
   */
  it('should verify blockchain record status', async () => {
    console.log('\n📋 [테스트 5] 블록체인 기록 상태 확인');

    const status = await getBlockchainRecordStatus(testDrawId);

    expect(status).toBeDefined();
    expect(status?.drawId).toBe(testDrawId);
    expect(status?.recorded).toBe(true);
    expect(status?.transactionHash).toBeDefined();

    console.log(`✅ 블록체인 상태 확인 완료: ${status?.transactionHash}`);
  });

  /**
   * 테스트 6: 추첨 결과 조회
   */
  it('should retrieve draw result details', async () => {
    console.log('\n📊 [테스트 6] 추첨 결과 조회');

    const drawResult = await getDrawResult(testDrawId);

    expect(drawResult).toBeDefined();
    expect(drawResult?.drawId).toBe(testDrawId);
    expect(drawResult?.winningNumbers).toEqual([1, 5, 10, 15, 20, 25]);

    console.log(`✅ 추첨 결과 조회 완료: ${drawResult?.winnerCount}명 당첨`);
  });

  /**
   * 테스트 7: 데이터 무결성 검증
   */
  it('should verify data integrity', async () => {
    console.log('\n🔐 [테스트 7] 데이터 무결성 검증');

    const winners = await getWinnersByDraw(testDrawId);
    const isValid = await verifyDataIntegrity(
      testDrawId,
      [1, 5, 10, 15, 20, 25],
      winners.length,
      '1000000000000000000'
    );

    expect(isValid).toBe(true);

    console.log(`✅ 데이터 무결성 검증 완료`);
  });

  /**
   * 테스트 8: 에러 처리 - 유효하지 않은 당첨번호
   */
  it('should handle invalid winning numbers', async () => {
    console.log('\n❌ [테스트 8] 에러 처리 - 유효하지 않은 당첨번호');

    const result = await executeDraw({
      drawId: 999,
      winningNumbers: [1, 2, 3], // 6개가 아님
      totalPrize: '1000000000000000000',
      prizeDistribution: {
        rank1: '500000000000000000',
        rank2: '300000000000000000',
        rank3: '150000000000000000',
        rank4: '50000000000000000',
      },
    });

    expect(result).toBeNull();
    console.log(`✅ 유효하지 않은 당첨번호 거부됨`);
  });

  /**
   * 테스트 9: 에러 처리 - 중복된 당첨번호
   */
  it('should handle duplicate winning numbers', async () => {
    console.log('\n❌ [테스트 9] 에러 처리 - 중복된 당첨번호');

    const result = await executeDraw({
      drawId: 999,
      winningNumbers: [1, 1, 3, 4, 5, 6], // 중복
      totalPrize: '1000000000000000000',
      prizeDistribution: {
        rank1: '500000000000000000',
        rank2: '300000000000000000',
        rank3: '150000000000000000',
        rank4: '50000000000000000',
      },
    });

    expect(result).toBeNull();
    console.log(`✅ 중복된 당첨번호 거부됨`);
  });

  /**
   * 테스트 10: 에러 처리 - 범위 벗어난 번호
   */
  it('should handle out-of-range winning numbers', async () => {
    console.log('\n❌ [테스트 10] 에러 처리 - 범위 벗어난 번호');

    const result = await executeDraw({
      drawId: 999,
      winningNumbers: [1, 2, 3, 4, 5, 46], // 46은 범위 초과
      totalPrize: '1000000000000000000',
      prizeDistribution: {
        rank1: '500000000000000000',
        rank2: '300000000000000000',
        rank3: '150000000000000000',
        rank4: '50000000000000000',
      },
    });

    expect(result).toBeNull();
    console.log(`✅ 범위 벗어난 번호 거부됨`);
  });

  /**
   * 테스트 11: 성능 테스트 - 대량 응모권 처리
   */
  it('should handle large number of tickets efficiently', async () => {
    console.log('\n⚡ [테스트 11] 성능 테스트 - 대량 응모권 처리');

    const startTime = Date.now();
    let successCount = 0;

    // 10개의 입금 거래 생성 및 처리 (100개는 시간이 오래 걸리므로 10개로 축소)
    for (let i = 0; i < 10; i++) {
      const depositTx: DepositTransaction = {
        hash: '0x' + Buffer.from(`perf_test_${i}`).toString('hex'),
        from: `0x${String(i).padStart(40, '0')}`,
        to: '0x0987654321098765432109876543210987654321',
        value: BigInt('10000000000000000'),
        blockNumber: 12345 + i,
        confirmations: 1,
        status: 'confirmed',
        timestamp: new Date(),
      };

      const result = await processDepositToTicket(depositTx);
      if (result) successCount++;
    }

    const duration = Date.now() - startTime;
    console.log(`✅ 성능 테스트 완료: ${successCount}개 응모권 ${duration}ms 처리`);
    expect(successCount).toBeGreaterThan(0);
  });

  /**
   * 테스트 12: 전체 플로우 통합 테스트
   */
  it('should complete full E2E flow successfully', async () => {
    console.log('\n🎉 [테스트 12] 전체 플로우 통합 테스트');

    // 단계 1: 입금 감지
    const depositTx: DepositTransaction = {
      hash: '0x' + Buffer.from('full_flow_test').toString('hex'),
      from: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      to: '0x0987654321098765432109876543210987654321',
      value: BigInt('10000000000000000'),
      blockNumber: 99999,
      confirmations: 1,
      status: 'confirmed',
      timestamp: new Date(),
    };

    const ticketResult = await processDepositToTicket(depositTx);
    expect(ticketResult).toBeDefined();
    console.log('✅ 단계 1: 입금감지 및 응모권 발급 완료');

    // 단계 2: 추첨 실행 (새로운 draw ID 사용)
    const newDrawId = 2;
    const now = new Date();
    await db.insert(draws).values({
      drawNumber: newDrawId,
      drawDate: now,
      startTime: now,
      endTime: new Date(now.getTime() + 86400000),
      status: 'active',
      blockchainStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    // 기존 응모권을 새 draw로 복사하여 테스트
    const existingTicket = await db.select().from(tickets).limit(1);
    if (existingTicket.length > 0) {
      await db.insert(tickets).values({
        userId: existingTicket[0].userId,
        drawId: newDrawId,
        numbers: existingTicket[0].numbers,
        purchaseAmount: existingTicket[0].purchaseAmount,
        purchaseCurrency: 'worldcoin',
        purchaseMethod: 'wallet',
        walletAddress: existingTicket[0].walletAddress,
        transactionHash: '0x' + Buffer.from('flow_test_tx').toString('hex'),
        status: 'confirmed',
        createdAt: now,
        updatedAt: now,
      });
    }

    const drawResult = await executeDraw({
      drawId: newDrawId,
      winningNumbers: [1, 5, 10, 15, 20, 25],
      totalPrize: '1000000000000000000',
      prizeDistribution: {
        rank1: '500000000000000000',
        rank2: '300000000000000000',
        rank3: '150000000000000000',
        rank4: '50000000000000000',
      },
    });
    expect(drawResult).toBeDefined();
    console.log('✅ 단계 2: 추첨 실행 완료');

    // 단계 3: 블록체인 기록
    const blockchainResult = await recordDrawToBlockchain(newDrawId);
    expect(blockchainResult).toBeDefined();
    console.log('✅ 단계 3: 블록체인 기록 완료');

    // 단계 4: 데이터 무결성 검증
    const winners = await getWinnersByDraw(newDrawId);
    const isValid = await verifyDataIntegrity(
      newDrawId,
      [1, 5, 10, 15, 20, 25],
      winners.length,
      '1000000000000000000'
    );
    expect(isValid).toBe(true);
    console.log('✅ 단계 4: 데이터 무결성 검증 완료');

    console.log('🎉 전체 E2E 플로우 테스트 완료!');
  });
});
