import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram
} from '@solana/web3.js';
import { 
  createBurnInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';

// Solana RPC endpoint (mainnet-beta for production, devnet for testing)
export const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'mainnet-beta';
export const RPC_ENDPOINT = process.env.SOLANA_RPC || `https://api.${SOLANA_NETWORK}.solana.com`;

// Default token to burn (can be changed in admin panel)
export const DEFAULT_TOKEN_ADDRESS = 'D6AQDyi8AVX7oHTdiY1MfQRfYmzjYHkfENUxx1uQpump';
export const DEFAULT_BURN_AMOUNT = 1000000; // 1M tokens (adjust decimals)

/**
 * Create a burn transaction
 * @param {string} userWalletAddress - User's wallet public key
 * @param {string} tokenMintAddress - Token mint address to burn
 * @param {number} amount - Amount to burn (in smallest unit)
 * @returns {Transaction} - Unsigned transaction
 */
export async function createBurnTransaction(userWalletAddress, tokenMintAddress, amount) {
  try {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    
    const userPublicKey = new PublicKey(userWalletAddress);
    const mintPublicKey = new PublicKey(tokenMintAddress);
    
    // Get the user's associated token account
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      userPublicKey
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    
    // Create burn instruction
    const burnInstruction = createBurnInstruction(
      userTokenAccount,  // Token account to burn from
      mintPublicKey,     // Mint
      userPublicKey,     // Owner of token account
      amount,            // Amount to burn
      [],                // Multi-signers (empty for single owner)
      TOKEN_PROGRAM_ID
    );
    
    // Create transaction
    const transaction = new Transaction({
      feePayer: userPublicKey,
      blockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
    }).add(burnInstruction);
    
    return transaction;
  } catch (error) {
    console.error('Error creating burn transaction:', error);
    throw new Error(`Failed to create burn transaction: ${error.message}`);
  }
}

/**
 * Verify a burn transaction on-chain
 * @param {string} txSignature - Transaction signature to verify
 * @returns {Promise<boolean>} - True if verified
 */
export async function verifyBurnTransaction(txSignature) {
  try {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    
    // Get transaction details
    const tx = await connection.getTransaction(txSignature, {
      commitment: 'confirmed'
    });
    
    if (!tx || tx.meta?.err) {
      console.error('Transaction not found or failed:', txSignature);
      return false;
    }
    
    console.log(`✅ Transaction verified: ${txSignature}`);
    return true;
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
}

/**
 * Get token balance
 * @param {string} walletAddress - Wallet public key
 * @param {string} tokenMintAddress - Token mint address
 * @returns {Promise<number>} - Token balance
 */
export async function getTokenBalance(walletAddress, tokenMintAddress) {
  try {
    const connection = new Connection(RPC_ENDPOINT, 'confirmed');
    
    const userPublicKey = new PublicKey(walletAddress);
    const mintPublicKey = new PublicKey(tokenMintAddress);
    
    const userTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      userPublicKey
    );
    
    const balance = await connection.getTokenAccountBalance(userTokenAccount);
    
    return balance.value.uiAmount || 0;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}



