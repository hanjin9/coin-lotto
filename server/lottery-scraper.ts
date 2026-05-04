/**
 * Lottery Scraper - 당첨번호 자동 조회
 * 한국 로또 공식 API에서 당첨번호를 자동으로 조회합니다.
 */

import axios from 'axios';

interface LottoWinningNumbers {
  drawNumber: number;
  drawDate: Date;
  winningNumbers: number[];
  bonusNumber: number;
  totalPrize: string;
}

/**
 * 최신 당첨번호 조회
 * 한국 로또 공식 API 사용
 */
export async function getLatestWinningNumbers(): Promise<LottoWinningNumbers | null> {
  try {
    // 한국 로또 공식 API
    const response = await axios.get('https://www.dhlottery.co.kr/common.do', {
      params: {
        method: 'getLottoNumber',
        drwNo: 0, // 최신 회차
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const data = response.data;

    // 응답 파싱
    if (!data || data.returnValue !== 'success') {
      console.error('[Lottery Scraper] Failed to fetch winning numbers:', data);
      return null;
    }

    const winningNumbers: number[] = [];
    for (let i = 1; i <= 6; i++) {
      const num = data[`drwtNo${i}`];
      if (num) winningNumbers.push(parseInt(num));
    }

    const bonusNumber = parseInt(data.bnusNo);

    return {
      drawNumber: parseInt(data.drwNo),
      drawDate: new Date(data.drwNoDate),
      winningNumbers: winningNumbers.sort((a, b) => a - b),
      bonusNumber,
      totalPrize: data.totSellAmt || '0',
    };
  } catch (error) {
    console.error('[Lottery Scraper] Error fetching winning numbers:', error);
    return null;
  }
}

/**
 * 특정 회차 당첨번호 조회
 */
export async function getWinningNumbersByDraw(drawNumber: number): Promise<LottoWinningNumbers | null> {
  try {
    const response = await axios.get('https://www.dhlottery.co.kr/common.do', {
      params: {
        method: 'getLottoNumber',
        drwNo: drawNumber,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const data = response.data;

    if (!data || data.returnValue !== 'success') {
      console.error(`[Lottery Scraper] Failed to fetch draw ${drawNumber}:`, data);
      return null;
    }

    const winningNumbers: number[] = [];
    for (let i = 1; i <= 6; i++) {
      const num = data[`drwtNo${i}`];
      if (num) winningNumbers.push(parseInt(num));
    }

    const bonusNumber = parseInt(data.bnusNo);

    return {
      drawNumber: parseInt(data.drwNo),
      drawDate: new Date(data.drwNoDate),
      winningNumbers: winningNumbers.sort((a, b) => a - b),
      bonusNumber,
      totalPrize: data.totSellAmt || '0',
    };
  } catch (error) {
    console.error(`[Lottery Scraper] Error fetching draw ${drawNumber}:`, error);
    return null;
  }
}

/**
 * 최근 N개 회차 당첨번호 조회
 */
export async function getRecentWinningNumbers(count: number = 5): Promise<LottoWinningNumbers[]> {
  const results: LottoWinningNumbers[] = [];

  // 최신 회차부터 역순으로 조회
  for (let i = 0; i < count; i++) {
    const winningNumbers = await getLatestWinningNumbers();
    if (winningNumbers) {
      results.push(winningNumbers);
      // API 요청 제한을 위해 딜레이 추가
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
