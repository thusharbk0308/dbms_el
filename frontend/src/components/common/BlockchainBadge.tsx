import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, Copy, Check } from 'lucide-react';

interface BlockchainBadgeProps {
  txHash?: string;
  blockNumber?: number;
  contractAddress?: string;
  timestamp?: string;
  status?: string;
}

export const BlockchainBadge: React.FC<BlockchainBadgeProps> = ({
  txHash,
  blockNumber,
  contractAddress,
  timestamp,
  status = 'CONFIRMED',
}) => {
  const [copied, setCopied] = useState(false);

  const copyTx = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncate = (str: string, lead = 8, trail = 6) => {
    if (!str || str.length <= lead + trail) return str;
    return `${str.slice(0, lead)}...${str.slice(-trail)}`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5 font-medium text-blue-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          On-Chain Proof
        </span>
        <span className="text-emerald-400 font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
          {status}
        </span>
      </div>

      {txHash ? (
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex items-center justify-between bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">Tx:</span>
            <span className="text-slate-200 select-all">{truncate(txHash, 10, 8)}</span>
            <button
              onClick={copyTx}
              className="text-slate-400 hover:text-white transition-colors ml-2"
              title="Copy Transaction Hash"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {blockNumber !== undefined && (
              <div className="bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50 flex justify-between">
                <span className="text-slate-400">Block:</span>
                <span className="text-blue-400 font-medium">#{blockNumber}</span>
              </div>
            )}
            {timestamp && (
              <div className="bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50 flex justify-between">
                <span className="text-slate-400">Time:</span>
                <span className="text-slate-300">{new Date(timestamp).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {contractAddress && (
            <div className="text-[10px] text-slate-400 truncate flex items-center justify-between pt-0.5">
              <span>Contract: {truncate(contractAddress, 6, 4)}</span>
              <span className="text-slate-400 flex items-center gap-0.5">
                Hardhat 31337 <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">No blockchain transaction confirmed yet.</p>
      )}
    </div>
  );
};
