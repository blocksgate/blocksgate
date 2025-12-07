import { BrowserProvider } from 'ethers';

interface Window {
  ethereum?: EthereumProvider;
}

export interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isWalletConnect?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (params: any) => void) => void;
  removeListener: (event: string, handler: (params: any) => void) => void;
  selectedAddress: string | null;
  chainId: string;
  enable: () => Promise<string[]>;
}

export interface WebSocketPriceFeed {
  getSubscribedTokens: () => string[];
  on: (event: string, handler: (data: any) => void) => void;
  removeListener: (event: string, handler: (data: any) => void) => void;
}

export interface PriceAggregator {
  getPriceHistory(token: string, timeframe: string): Promise<PriceBar[]>;
}

export interface PriceBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}