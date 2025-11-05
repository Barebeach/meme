import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { 
  createBurnInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';

const WalletContext = createContext({});

export const useWallet = () => useContext(WalletContext);

// Solana RPC endpoints (multiple with fallback)
const RPC_ENDPOINTS = [
  'https://mainnet.helius-rpc.com/?api-key=48430da6-f3d3-485b-8260-9c034503b76b',  // Helius with API key
  'https://api.mainnet-beta.solana.com',              // Public endpoint fallback
  'https://solana-mainnet.g.alchemy.com/v2/demo',     // Alchemy demo fallback
];

let currentRpcIndex = 0;

function getConnection() {
  const endpoint = RPC_ENDPOINTS[currentRpcIndex];
  return new Connection(endpoint, 'confirmed');
}

function tryNextRpc() {
  currentRpcIndex = (currentRpcIndex + 1) % RPC_ENDPOINTS.length;
  console.log(`🔄 Switching to RPC: ${RPC_ENDPOINTS[currentRpcIndex]}`);
}

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState(null);

  // Check if Phantom is installed
  const phantom = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window?.solana?.isPhantom ? window.solana : null;
    }
    return null;
  }, []);

  // Connect wallet
  const connect = async () => {
    if (!phantom) {
      alert('Phantom wallet not found! Please install Phantom wallet extension.');
      window.open('https://phantom.app/', '_blank');
      return;
    }

    try {
      setConnecting(true);
      const response = await phantom.connect();
      const pubKey = response.publicKey.toString();
      
      setWallet(phantom);
      setPublicKey(pubKey);
      setConnected(true);
      
      console.log('✅ Wallet connected:', pubKey);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    if (phantom) {
      await phantom.disconnect();
      setWallet(null);
      setPublicKey(null);
      setConnected(false);
      console.log('Wallet disconnected');
    }
  };

  // Burn tokens
  const burnTokens = async (tokenMintAddress, amount) => {
    if (!connected || !publicKey) {
      throw new Error('Wallet not connected');
    }

    let lastError;
    for (let attempt = 0; attempt < RPC_ENDPOINTS.length; attempt++) {
      try {
        const connection = getConnection();
        
        const userPublicKey = new PublicKey(publicKey);
        const mintPublicKey = new PublicKey(tokenMintAddress);
        
        // Get the user's associated token account
        const userTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          userPublicKey
        );
        
        // Check token balance
        const tokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
        if (tokenBalance.value.uiAmount < amount) {
          throw new Error(`Insufficient token balance. You have ${tokenBalance.value.uiAmount}, need ${amount}`);
        }
        
        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        
        // Convert amount to smallest unit (assuming 6 decimals for most SPL tokens)
        const burnAmount = Math.floor(amount * Math.pow(10, tokenBalance.value.decimals));
        
        // Create burn instruction
        const burnInstruction = createBurnInstruction(
          userTokenAccount,  // Token account to burn from
          mintPublicKey,     // Mint
          userPublicKey,     // Owner of token account
          burnAmount,        // Amount to burn
          [],                // Multi-signers (empty for single owner)
          TOKEN_PROGRAM_ID
        );
        
        // Create transaction
        const transaction = new Transaction({
          feePayer: userPublicKey,
          blockhash,
          lastValidBlockHeight
        }).add(burnInstruction);
        
        // Sign and send transaction
        const { signature } = await phantom.signAndSendTransaction(transaction);
        
        // Wait for confirmation
        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        });
        
        console.log(`✅ Tokens burned! Signature: ${signature}`);
        
        return signature;
      } catch (error) {
        lastError = error;
        console.error(`❌ RPC attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt < RPC_ENDPOINTS.length - 1) {
          tryNextRpc();
        }
      }
    }
    
    throw new Error(`Failed to burn tokens after trying all RPCs: ${lastError?.message}`);
  };

  // Get token balance
  const getTokenBalance = async (tokenMintAddress) => {
    if (!connected || !publicKey) {
      return 0;
    }

    for (let attempt = 0; attempt < RPC_ENDPOINTS.length; attempt++) {
      try {
        const connection = getConnection();
        
        const userPublicKey = new PublicKey(publicKey);
        const mintPublicKey = new PublicKey(tokenMintAddress);
        
        const userTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          userPublicKey
        );
        
        const balance = await connection.getTokenAccountBalance(userTokenAccount);
        
        console.log(`✅ Token balance retrieved: ${balance.value.uiAmount || 0}`);
        return balance.value.uiAmount || 0;
      } catch (error) {
        console.error(`❌ RPC attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt < RPC_ENDPOINTS.length - 1) {
          tryNextRpc();
        } else {
          console.error('Failed to get token balance after trying all RPCs');
          return 0;
        }
      }
    }
    
    return 0;
  };

  // Auto-connect on page load if previously connected
  useEffect(() => {
    if (phantom && phantom.isConnected) {
      connect();
    }
  }, [phantom]);

  const value = {
    wallet,
    connected,
    connecting,
    publicKey,
    connect,
    disconnect,
    burnTokens,
    getTokenBalance
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

