/// <reference types="node" />

import type { EthereumProvider } from './ethereum';

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}