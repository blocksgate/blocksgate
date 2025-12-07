import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { ethers } from 'ethers';
import type { EthereumProvider } from './types/ethereum';
import type { Profile } from './types/supabase';

export async function validateWalletAuth(req: NextRequest) {
  const supabase = createClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return NextResponse.json(
      { error: 'Unauthorized - No valid session' },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('eth_address')
    .eq('id', session.user.id)
    .single<Profile>();

  if (!profile?.eth_address) {
    return NextResponse.json(
      { error: 'Unauthorized - No wallet connected' },
      { status: 401 }
    );
  }

  return {
    userId: session.user.id,
    walletAddress: profile.eth_address
  };
}

export async function getWalletSignature(address: string, nonce: string): Promise<string> {
  if (!window.ethereum) {
    throw new Error('No Ethereum provider found');
  }

  const message = `Welcome to V0! Please sign this message to verify your wallet.\n\nNonce: ${nonce}`;
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  if (signer.address.toLowerCase() !== address.toLowerCase()) {
    throw new Error('Selected wallet address does not match');
  }

  return await signer.signMessage(message);
}