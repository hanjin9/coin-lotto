/**
 * Ethereum Sepolia Integration - 블록체인 연동
 * 
 * 기능:
 * 1. Ethereum Sepolia 테스트넷 RPC 연동
 * 2. 로또 추첨 스마트 컨트랙트 배포 및 호출
 * 3. 추첨 결과 온체인 기록
 * 4. 온체인 당첨자 검증
 * 5. 당첨자 상금 청구 처리
 */

import { ethers } from 'ethers';

/**
 * Ethereum Sepolia 설정
 */
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';
const PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY || '';
const LOTTO_CONTRACT_ADDRESS = process.env.LOTTO_CONTRACT_ADDRESS || '';

/**
 * Ethereum 프로바이더 및 서명자 초기화
 */
let provider: ethers.JsonRpcProvider;
let signer: ethers.Wallet;

export function initializeEthereum(): void {
  try {
    provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    signer = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log('✅ Ethereum Sepolia 연동 성공');
  } catch (error) {
    console.error('❌ Ethereum 초기화 실패:', error);
    throw error;
  }
}

/**
 * 로또 스마트 컨트랙트 ABI
 */
const LOTTO_CONTRACT_ABI = [
  {
    name: 'recordDraw',
    type: 'function',
    inputs: [
      { name: 'drawId', type: 'uint256' },
      { name: 'winningNumbers', type: 'uint256[]' },
      { name: 'winners', type: 'address[]' },
      { name: 'prizes', type: 'uint256[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'claimPrize',
    type: 'function',
    inputs: [
      { name: 'drawId', type: 'uint256' },
      { name: 'winnerId', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'payable',
  },
  {
    name: 'verifyWinner',
    type: 'function',
    inputs: [
      { name: 'drawId', type: 'uint256' },
      { name: 'winnerAddress', type: 'address' },
    ],
    outputs: [{ name: 'isWinner', type: 'bool' }, { name: 'prize', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'getDrawResult',
    type: 'function',
    inputs: [{ name: 'drawId', type: 'uint256' }],
    outputs: [
      { name: 'winningNumbers', type: 'uint256[]' },
      { name: 'winnerCount', type: 'uint256' },
      { name: 'totalPrize', type: 'uint256' },
      { name: 'blockNumber', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
];

/**
 * 추첨 결과 온체인 기록
 */
export interface DrawRecordResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  status: 'success' | 'failure';
  timestamp: Date;
}

export async function recordDrawOnChain(
  drawId: number,
  winningNumbers: number[],
  winners: string[],
  prizes: string[]
): Promise<DrawRecordResult> {
  try {
    if (!signer) {
      initializeEthereum();
    }

    const contract = new ethers.Contract(
      LOTTO_CONTRACT_ADDRESS,
      LOTTO_CONTRACT_ABI,
      signer
    );

    console.log('📝 추첨 결과 온체인 기록 시작:', {
      drawId,
      winningNumbers,
      winners: winners.length,
      prizes: prizes.length,
    });

    // 트랜잭션 생성
    const tx = await contract.recordDraw(
      drawId,
      winningNumbers,
      winners,
      prizes
    );

    console.log('⏳ 트랜잭션 대기 중:', tx.hash);

    // 트랜잭션 확인 대기 (1 confirmation)
    const receipt = await tx.wait(1);

    const result: DrawRecordResult = {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failure',
      timestamp: new Date(),
    };

    console.log('✅ 추첨 결과 온체인 기록 완료:', result);
    return result;
  } catch (error) {
    console.error('❌ 온체인 기록 실패:', error);
    throw error;
  }
}

/**
 * 온체인 당첨자 검증
 */
export interface VerifyWinnerResult {
  isWinner: boolean;
  prize: string;
  verified: boolean;
  timestamp: Date;
}

export async function verifyWinnerOnChain(
  drawId: number,
  winnerAddress: string
): Promise<VerifyWinnerResult> {
  try {
    if (!provider) {
      initializeEthereum();
    }

    const contract = new ethers.Contract(
      LOTTO_CONTRACT_ADDRESS,
      LOTTO_CONTRACT_ABI,
      provider
    );

    console.log('🔍 당첨자 온체인 검증:', { drawId, winnerAddress });

    const [isWinner, prize] = await contract.verifyWinner(drawId, winnerAddress);

    const result: VerifyWinnerResult = {
      isWinner,
      prize: prize.toString(),
      verified: true,
      timestamp: new Date(),
    };

    console.log('✅ 당첨자 검증 완료:', result);
    return result;
  } catch (error) {
    console.error('❌ 당첨자 검증 실패:', error);
    throw error;
  }
}

/**
 * 당첨자 상금 청구 (스마트 컨트랙트 호출)
 */
export interface ClaimPrizeResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  prizeAmount: string;
  status: 'success' | 'failure';
  timestamp: Date;
}

export async function claimPrizeOnChain(
  drawId: number,
  winnerId: number,
  prizeAmount: string
): Promise<ClaimPrizeResult> {
  try {
    if (!signer) {
      initializeEthereum();
    }

    const contract = new ethers.Contract(
      LOTTO_CONTRACT_ADDRESS,
      LOTTO_CONTRACT_ABI,
      signer
    );

    console.log('💳 상금 청구 시작:', { drawId, winnerId, prizeAmount });

    // Wei 단위로 변환 (1 ETH = 10^18 Wei)
    const prizeInWei = ethers.parseEther(prizeAmount);

    // 트랜잭션 생성 (상금 전송)
    const tx = await contract.claimPrize(drawId, winnerId, {
      value: prizeInWei,
    });

    console.log('⏳ 상금 청구 트랜잭션 대기 중:', tx.hash);

    // 트랜잭션 확인 대기
    const receipt = await tx.wait(1);

    const result: ClaimPrizeResult = {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      prizeAmount,
      status: receipt.status === 1 ? 'success' : 'failure',
      timestamp: new Date(),
    };

    console.log('✅ 상금 청구 완료:', result);
    return result;
  } catch (error) {
    console.error('❌ 상금 청구 실패:', error);
    throw error;
  }
}

/**
 * 추첨 결과 조회 (온체인)
 */
export interface OnChainDrawResult {
  drawId: number;
  winningNumbers: number[];
  winnerCount: number;
  totalPrize: string;
  blockNumber: number;
  transactionHash?: string;
  timestamp: Date;
}

export async function getDrawResultOnChain(
  drawId: number
): Promise<OnChainDrawResult> {
  try {
    if (!provider) {
      initializeEthereum();
    }

    const contract = new ethers.Contract(
      LOTTO_CONTRACT_ADDRESS,
      LOTTO_CONTRACT_ABI,
      provider
    );

    console.log('📊 추첨 결과 조회:', { drawId });

    const [winningNumbers, winnerCount, totalPrize, blockNumber] =
      await contract.getDrawResult(drawId);

    const result: OnChainDrawResult = {
      drawId,
      winningNumbers: winningNumbers.map((n: bigint) => Number(n)),
      winnerCount: Number(winnerCount),
      totalPrize: ethers.formatEther(totalPrize),
      blockNumber: Number(blockNumber),
      timestamp: new Date(),
    };

    console.log('✅ 추첨 결과 조회 완료:', result);
    return result;
  } catch (error) {
    console.error('❌ 추첨 결과 조회 실패:', error);
    throw error;
  }
}

/**
 * 블록체인 거래 상태 모니터링
 */
export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  confirmations: number;
  gasUsed?: string;
  timestamp: Date;
}

export async function monitorTransaction(
  transactionHash: string
): Promise<TransactionStatus> {
  try {
    if (!provider) {
      initializeEthereum();
    }

    console.log('👁️ 거래 모니터링:', transactionHash);

    const receipt = await provider.getTransactionReceipt(transactionHash);

    if (!receipt) {
      return {
        hash: transactionHash,
        status: 'pending',
        confirmations: 0,
        timestamp: new Date(),
      };
    }

    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;

    const result: TransactionStatus = {
      hash: transactionHash,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      blockNumber: receipt.blockNumber,
      confirmations,
      gasUsed: receipt.gasUsed.toString(),
      timestamp: new Date(),
    };

    console.log('✅ 거래 상태:', result);
    return result;
  } catch (error) {
    console.error('❌ 거래 모니터링 실패:', error);
    throw error;
  }
}

/**
 * 거래 실패 처리 및 재시도
 */
export async function retryFailedTransaction(
  transactionHash: string,
  maxRetries: number = 3
): Promise<DrawRecordResult | null> {
  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 재시도 ${attempt}/${maxRetries}:`, transactionHash);

      const status = await monitorTransaction(transactionHash);

      if (status.status === 'confirmed') {
        console.log('✅ 거래 확인됨');
        return {
          transactionHash,
          blockNumber: status.blockNumber || 0,
          gasUsed: status.gasUsed || '0',
          status: 'success',
          timestamp: new Date(),
        };
      }

      if (status.status === 'failed') {
        console.log('❌ 거래 실패, 재시도 중...');
        // 지수 백오프: 1초, 5초, 30초
        const delay = [1000, 5000, 30000][attempt - 1];
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.log('❌ 최대 재시도 횟수 초과');
    return null;
  } catch (error) {
    console.error('❌ 거래 재시도 실패:', error);
    throw error;
  }
}
