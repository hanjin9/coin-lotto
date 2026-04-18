/**
 * Price Watcher - 실시간 시세 연동
 * CoinGecko API를 통해 암호화폐 시세를 실시간으로 조회하고 저장합니다.
 */

import axios from 'axios';

/**
 * CoinGecko API 기본 URL
 */
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

/**
 * 지원하는 암호화폐 목록
 */
export const SUPPORTED_COINS = {
  ethereum: 'ethereum',
  bitcoin: 'bitcoin',
  usdt: 'tether',
  usdc: 'usd-coin',
  dai: 'dai',
} as const;

/**
 * 지원하는 통화
 */
export const SUPPORTED_CURRENCIES = {
  usd: 'usd',
  krw: 'krw',
  eur: 'eur',
} as const;

/**
 * 암호화폐 시세 정보
 */
export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  totalVolume: number;
  high24h: number;
  low24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  ath: number;
  athChangePercent: number;
  atl: number;
  atlChangePercent: number;
  lastUpdated: Date;
}

/**
 * 단일 암호화폐 시세 조회
 */
export async function getCryptoPrice(
  coinId: string,
  currency: string = 'usd'
): Promise<CryptoPrice | null> {
  try {
    const response = await axios.get(`${COINGECKO_API_BASE}/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false,
        vs_currency: currency,
      },
    });

    const data = response.data;

    return {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      currentPrice: data.market_data.current_price[currency],
      marketCap: data.market_data.market_cap[currency],
      marketCapRank: data.market_cap_rank,
      totalVolume: data.market_data.total_volume[currency],
      high24h: data.market_data.high_24h[currency],
      low24h: data.market_data.low_24h[currency],
      priceChange24h: data.market_data.price_change_24h,
      priceChangePercent24h: data.market_data.price_change_percentage_24h,
      circulatingSupply: data.market_data.circulating_supply,
      totalSupply: data.market_data.total_supply,
      maxSupply: data.market_data.max_supply,
      ath: data.market_data.ath[currency],
      athChangePercent: data.market_data.ath_change_percentage[currency],
      atl: data.market_data.atl[currency],
      atlChangePercent: data.market_data.atl_change_percentage[currency],
      lastUpdated: new Date(data.last_updated),
    };
  } catch (error) {
    console.error(`❌ 시세 조회 중 오류 (${coinId}):`, error);
    return null;
  }
}

/**
 * 여러 암호화폐 시세 일괄 조회
 */
export async function getMultiplePrices(
  coinIds: string[],
  currency: string = 'usd'
): Promise<CryptoPrice[]> {
  try {
    const response = await axios.get(`${COINGECKO_API_BASE}/coins/markets`, {
      params: {
        vs_currency: currency,
        ids: coinIds.join(','),
        order: 'market_cap_desc',
        per_page: 250,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h',
      },
    });

    return response.data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      currentPrice: coin.current_price,
      marketCap: coin.market_cap,
      marketCapRank: coin.market_cap_rank,
      totalVolume: coin.total_volume,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      priceChange24h: coin.price_change_24h,
      priceChangePercent24h: coin.price_change_percentage_24h,
      circulatingSupply: coin.circulating_supply,
      totalSupply: coin.total_supply,
      maxSupply: coin.max_supply,
      ath: coin.ath,
      athChangePercent: coin.ath_change_percentage,
      atl: coin.atl,
      atlChangePercent: coin.atl_change_percentage,
      lastUpdated: new Date(),
    }));
  } catch (error) {
    console.error('❌ 여러 시세 조회 중 오류:', error);
    return [];
  }
}

/**
 * 실시간 시세 감시 (주기적 업데이트)
 */
export async function watchPrices(
  coinIds: string[],
  currency: string = 'usd',
  intervalMs: number = 60000, // 기본값: 1분
  onPriceUpdate: (prices: CryptoPrice[]) => Promise<void>
): Promise<NodeJS.Timeout> {
  console.log(`📊 시세 감시 시작: ${coinIds.join(', ')} (${intervalMs}ms 주기)`);

  // 초기 조회
  const initialPrices = await getMultiplePrices(coinIds, currency);
  if (initialPrices.length > 0) {
    await onPriceUpdate(initialPrices);
  }

  // 주기적 업데이트
  const watchInterval = setInterval(async () => {
    try {
      const prices = await getMultiplePrices(coinIds, currency);
      if (prices.length > 0) {
        await onPriceUpdate(prices);
      }
    } catch (error) {
      console.error('❌ 시세 감시 중 오류:', error);
    }
  }, intervalMs);

  return watchInterval;
}

/**
 * 시세 변동 알림 (임계값 기반)
 */
export interface PriceAlert {
  coinId: string;
  symbol: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  timestamp: Date;
}

export async function checkPriceAlerts(
  prices: CryptoPrice[],
  previousPrices: Map<string, number>,
  thresholdPercent: number = 5 // 5% 이상 변동 시 알림
): Promise<PriceAlert[]> {
  const alerts: PriceAlert[] = [];

  for (const price of prices) {
    const prevPrice = previousPrices.get(price.id);

    if (prevPrice) {
      const changePercent = ((price.currentPrice - prevPrice) / prevPrice) * 100;

      if (Math.abs(changePercent) >= thresholdPercent) {
        alerts.push({
          coinId: price.id,
          symbol: price.symbol,
          currentPrice: price.currentPrice,
          previousPrice: prevPrice,
          changePercent,
          timestamp: new Date(),
        });

        console.log(
          `🚨 가격 변동 알림: ${price.symbol} ${changePercent > 0 ? '📈' : '📉'} ${Math.abs(changePercent).toFixed(2)}%`
        );
      }
    }

    // 이전 가격 업데이트
    previousPrices.set(price.id, price.currentPrice);
  }

  return alerts;
}

/**
 * 감시 중지
 */
export function stopPriceWatcher(watchInterval: NodeJS.Timeout) {
  clearInterval(watchInterval);
  console.log('🛑 시세 감시 중지됨');
}

/**
 * 지갑 연동 - MetaMask 지원
 */
export interface WalletInfo {
  address: string;
  balance: number; // ETH 단위
  chainId: number;
  chainName: string;
}

/**
 * 지갑 주소 검증
 */
export function validateWalletAddress(address: string): boolean {
  // Ethereum 주소 형식 검증 (0x로 시작하는 42자 16진수)
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * 지갑 주소 정규화
 */
export function normalizeWalletAddress(address: string): string {
  return address.toLowerCase();
}

/**
 * 체인 ID별 체인명
 */
export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon',
  80001: 'Polygon Mumbai',
  56: 'Binance Smart Chain',
  97: 'BSC Testnet',
  43114: 'Avalanche',
  250: 'Fantom',
  42161: 'Arbitrum One',
};

/**
 * 체인 정보 조회
 */
export function getChainInfo(chainId: number): { name: string; symbol: string } | null {
  const name = CHAIN_NAMES[chainId];
  if (!name) return null;

  return {
    name,
    symbol: chainId === 1 ? 'ETH' : 'Token',
  };
}
