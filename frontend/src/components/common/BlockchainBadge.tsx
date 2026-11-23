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

  const truncate = (str: string, lead = 10, trail = 8) => {
    if (!str || str.length <= lead + trail) return str;
    return `${str.slice(0, lead)}...${str.slice(-trail)}`;
  };

  return (
    <div className="bg-[#FFFFFF] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs text-[#171717]">
          <ShieldCheck className="w-4 h-4 text-[#55AAA7]" />
          On-Chain Proof
        </span>
        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 bg-[#55AAA7] text-[#171717] border-2 border-[#171717] shadow-[1px_1px_0px_#171717]">
          {status}
        </span>
      </div>

      {txHash ? (
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between bg-[#F8F6F2] px-3 py-2 border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
            <span className="text-[#666666] text-[11px] font-bold uppercase">Tx:</span>
            <span className="text-[#171717] font-bold select-all">{truncate(txHash)}</span>
            <button
              onClick={copyTx}
              className="p-1 bg-[#FFFFFF] hover:bg-[#E9786D] text-[#171717] border border-[#171717] shadow-[1px_1px_0px_#171717] transition-all ml-2"
              title="Copy Transaction Hash"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#171717]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-[#F8F6F2] p-2 border-2 border-[#171717]">
              <span className="text-[#666666] uppercase text-[10px] block font-bold">Block</span>
              <span className="text-[#171717] font-bold">#{blockNumber ?? '—'}</span>
            </div>
            <div className="bg-[#F8F6F2] p-2 border-2 border-[#171717]">
              <span className="text-[#666666] uppercase text-[10px] block font-bold">Timestamp</span>
              <span className="text-[#171717] font-bold truncate block">
                {timestamp ? new Date(timestamp).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>

          {contractAddress && (
            <div className="text-[10px] text-[#666666] truncate pt-1">
              Contract: <span className="text-[#171717] font-bold">{truncate(contractAddress, 8, 6)}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs font-mono text-[#666666] bg-[#F8F6F2] p-3 border-2 border-[#171717]">
          Blockchain registration pending or unconfirmed on local node.
        </div>
      )}
    </div>
  );
};
