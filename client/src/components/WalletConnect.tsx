/**
 * WalletConnect - 지갑 연동 UI 컴포넌트
 */

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, Copy, LogOut } from 'lucide-react';
import { useState } from 'react';

/**
 * 지갑 연동 컴포넌트
 */
export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {isConnected && address ? (
        <Card className="p-4 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-yellow-700/50">
          <div className="space-y-3">
            {/* 지갑 주소 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-400">지갑 주소</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-yellow-400">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 hover:bg-yellow-700/20 rounded transition"
                  title="주소 복사"
                >
                  <Copy className="w-4 h-4 text-yellow-500" />
                </button>
              </div>
            </div>

            {/* 잔액 */}
            {balance && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">잔액</span>
                <span className="text-sm font-semibold text-yellow-400">
                  {(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} {balance.symbol}
                </span>
              </div>
            )}

            {/* 네트워크 */}
            {chain && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">네트워크</span>
                <span className="text-sm font-semibold text-yellow-400">{chain.name}</span>
              </div>
            )}

            {/* 연결 해제 버튼 */}
            <ConnectButton />
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-yellow-700/50">
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-400">지갑을 연결하여 로또를 구매하세요</p>
            <ConnectButton />
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * 지갑 상태 표시 컴포넌트
 */
export function WalletStatus() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  if (!isConnected) {
    return (
      <div className="text-sm text-gray-400">
        지갑 미연결
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span className="text-gray-300">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
      {balance && (
        <span className="text-yellow-400 font-semibold">
          {(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} {balance.symbol}
        </span>
      )}
    </div>
  );
}
