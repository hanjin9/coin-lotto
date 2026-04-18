/**
 * Mempool Watcher - 입금 감지 로직
 * 실시간으로 블록체인 Mempool에서 입금 거래를 감지하고 자동 응모를 트리거합니다.
 */

import { createPublicClient, http, parseEther, isAddress, Hex } from 'viem';
import { mainnet } from 'viem/chains';
import { getDb } from './db';
import { transactions } from '../drizzle/schema';

// Viem Public Client 초기화
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.RPC_URL || 'https://eth.llamarpc.com'),
});

/**
 * 입금 감지 설정
 */
export interface DepositWatcherConfig {
  targetAddress: string; // 감시할 지갑 주소
  minAmount: bigint; // 최소 입금액 (wei)
  maxConfirmations: number; // 최대 확인 블록 수
}

/**
 * 입금 거래 정보
 */
export interface DepositTransaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  blockNumber: number | null;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
}

/**
 * Mempool에서 입금 거래 감지
 */
export async function watchMempoolDeposits(
  config: DepositWatcherConfig,
  onDepositDetected: (tx: DepositTransaction) => Promise<void>
) {
  if (!isAddress(config.targetAddress)) {
    throw new Error('Invalid target address');
  }

  console.log(`🔍 Mempool Watcher 시작: ${config.targetAddress}`);

  // 최신 블록 번호 가져오기
  let lastBlockNumber = await publicClient.getBlockNumber();

  // 실시간 감시 루프
  const watchInterval = setInterval(async () => {
    try {
      const currentBlockNumber = await publicClient.getBlockNumber();

      // 새로운 블록이 생성되었을 때만 처리
      if (currentBlockNumber > lastBlockNumber) {
        console.log(`📦 새 블록 감지: ${currentBlockNumber}`);

        // 최근 블록들에서 거래 조회
        for (let i = Number(lastBlockNumber) + 1; i <= Number(currentBlockNumber); i++) {
          const block = await publicClient.getBlock({ blockNumber: BigInt(i) });

          if (block.transactions && block.transactions.length > 0) {
            for (const txHash of block.transactions) {
              const tx = await publicClient.getTransaction({ hash: txHash });

              // 입금 거래 확인
              if (
                tx.to &&
                tx.to.toLowerCase() === config.targetAddress.toLowerCase() &&
                tx.value &&
                tx.value >= config.minAmount
              ) {
                const depositTx: DepositTransaction = {
                  hash: tx.hash,
                  from: tx.from,
                  to: tx.to,
                  value: tx.value,
                  blockNumber: i,
                  confirmations: Number(currentBlockNumber) - i,
                  status: 'confirmed',
                  timestamp: new Date(Number(block.timestamp) * 1000),
                };

                console.log(`✅ 입금 감지됨: ${tx.hash}`);
                console.log(`   금액: ${tx.value / BigInt(10 ** 18)} ETH`);

                // 콜백 실행
                await onDepositDetected(depositTx);

                // DB에 저장
                await saveTransaction(depositTx);
              }
            }
          }
        }

        lastBlockNumber = currentBlockNumber;
      }
    } catch (error) {
      console.error('❌ Mempool 감시 중 오류:', error);
    }
  }, 12000); // 12초마다 확인 (Ethereum 블록 시간 약 12초)

  return watchInterval;
}

/**
 * Pending 거래 감지 (빠른 응모를 위해)
 */
export async function watchPendingTransactions(
  targetAddress: string,
  minAmount: bigint,
  onPendingDetected: (tx: DepositTransaction) => Promise<void>
) {
  if (!isAddress(targetAddress)) {
    throw new Error('Invalid target address');
  }

  console.log(`⏳ Pending 거래 감시 시작: ${targetAddress}`);

  // Pending 거래 감시 루프
  const watchInterval = setInterval(async () => {
    try {
      // 최신 블록 조회
      const block = await publicClient.getBlock({ blockTag: 'pending' });

      if (block.transactions && block.transactions.length > 0) {
        for (const txHash of block.transactions) {
          const tx = await publicClient.getTransaction({ hash: txHash });

          // Pending 입금 거래 확인
          if (
            tx.to &&
            tx.to.toLowerCase() === targetAddress.toLowerCase() &&
            tx.value &&
            tx.value >= minAmount
          ) {
            const pendingTx: DepositTransaction = {
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              blockNumber: null, // Pending이므로 블록 번호 없음
              confirmations: 0,
              status: 'pending',
              timestamp: new Date(),
            };

            console.log(`⚡ Pending 입금 감지됨: ${tx.hash}`);
            console.log(`   금액: ${tx.value / BigInt(10 ** 18)} ETH`);

            // 콜백 실행
            await onPendingDetected(pendingTx);

            // DB에 저장
            await saveTransaction(pendingTx);
          }
        }
      }
    } catch (error) {
      console.error('❌ Pending 거래 감시 중 오류:', error);
    }
  }, 3000); // 3초마다 확인

  return watchInterval;
}

/**
 * 거래를 DB에 저장
 */
async function saveTransaction(tx: DepositTransaction) {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[Database] Cannot save transaction: database not available');
      return;
    }
    await db.insert(transactions).values({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      blockNumber: tx.blockNumber,
      confirmations: tx.confirmations,
      status: tx.status,
      createdAt: tx.timestamp,
      updatedAt: new Date(),
    });

    console.log(`💾 거래 저장됨: ${tx.hash}`);
  } catch (error) {
    console.error('❌ 거래 저장 중 오류:', error);
  }
}

/**
 * 거래 상태 확인
 */
export async function getTransactionStatus(hash: string): Promise<DepositTransaction | null> {
  try {
    const hexHash = hash as Hex;
    const tx = await publicClient.getTransaction({ hash: hexHash });
    const receipt = await publicClient.getTransactionReceipt({ hash: hexHash });

    if (!tx) return null;

    const currentBlockNumber = await publicClient.getBlockNumber();
    const confirmations = receipt
      ? Number(currentBlockNumber) - Number(receipt.blockNumber)
      : 0;

    const toAddress = (tx.to || '0x0000000000000000000000000000000000000000') as Hex;
    const fromAddress = tx.from as Hex;
    const hashValue = tx.hash as Hex;

    return {
      hash: hashValue,
      from: fromAddress,
      to: toAddress,
      value: tx.value || BigInt(0),
      blockNumber: receipt?.blockNumber ? Number(receipt.blockNumber) : null,
      confirmations,
      status: receipt ? (receipt.status === 'success' ? 'confirmed' : 'failed') : 'pending',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('❌ 거래 상태 확인 중 오류:', error);
    return null;
  }
}

/**
 * 감시 중지
 */
export function stopWatcher(watchInterval: NodeJS.Timeout) {
  clearInterval(watchInterval);
  console.log('🛑 Mempool Watcher 중지됨');
}
