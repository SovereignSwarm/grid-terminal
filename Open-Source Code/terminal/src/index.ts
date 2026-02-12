#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const program = new Command();

// --- Utilities ---

/**
 * Validates if a string is a valid Solana PublicKey
 */
function validateAddress(address: string, label: string = 'Address'): string {
  try {
    new PublicKey(address);
    return address;
  } catch (e) {
    throw new Error(`Invalid ${label}: ${address}. Must be a base58 encoded Solana address.`);
  }
}

/**
 * Robust Keypair Loader supporting JSON arrays and Base58 strings
 */
async function loadKeypair(): Promise<Keypair> {
  const keyPath = process.env.KEYPAIR_PATH || path.resolve(process.cwd(), 'id.json');
  let secretString = process.env.PRIVATE_KEY;

  if (!secretString && fs.existsSync(keyPath)) {
    secretString = fs.readFileSync(keyPath, 'utf8').trim();
  }

  if (!secretString) {
    throw new Error("No signer found. Set PRIVATE_KEY in .env or create id.json");
  }

  try {
    if (secretString.startsWith('[')) {
      // JSON Array format
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretString)));
    } else {
      // Base58 format
      // @ts-ignore - bs58 may not have @types installed in this environment
      const { default: bs58 } = await import('bs58');
      return Keypair.fromSecretKey(bs58.decode(secretString));
    }
  } catch (e: any) {
    throw new Error(`Failed to parse keypair: ${e.message}`);
  }
}

const getRPC = () => process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

program
  .name('grid-terminal')
  .description('Industrial RPC Trading Terminal for the Sovereign Swarm')
  .version('2.3.0');

// --- Market Operations ---

program
  .command('buy <mint> <amount_sol>')
  .description('Execute a market buy (SOL -> Token)')
  .option('-s, --slippage <percent>', 'Max slippage percentage', '10')
  .action(async (mint, amount_sol, options) => {
    try {
      validateAddress(mint, 'Mint');
      const amount = parseFloat(amount_sol);
      if (isNaN(amount) || amount <= 0) throw new Error("Amount must be a positive number.");

      const payer = await loadKeypair();
      console.log(chalk.green(`[GRID_EXEC] Initiating Market Buy...`));
      console.log(chalk.cyan(`  Signer: ${payer.publicKey.toBase58()}`));
      console.log(chalk.cyan(`  Mint: ${mint}`));
      console.log(chalk.cyan(`  Amount: ${amount} SOL`));

      const connection = new Connection(getRPC(), 'confirmed');
      const balance = await connection.getBalance(payer.publicKey);
      if (balance < amount * LAMPORTS_PER_SOL) {
        throw new Error(`Insufficient balance: ${balance / LAMPORTS_PER_SOL} SOL`);
      }

      console.log(chalk.yellow(`[SYSTEM] Routing through Lattice Liquidity Engine...`));
      console.log(chalk.red(`❌ [ERROR] Market Swap Implementation Pending (Requires Jupiter Integration)`));
    } catch (e: any) {
      console.error(chalk.red(`❌ [ERROR] ${e.message}`));
    }
  });

program
  .command('sell <mint> <amount>')
  .description('Execute a market sell (Token -> SOL)')
  .option('-s, --slippage <percent>', 'Max slippage percentage', '10')
  .action(async (mint, amount, options) => {
    try {
      validateAddress(mint, 'Mint');
      const payer = await loadKeypair();
      console.log(chalk.red(`[GRID_EXEC] Initiating Market Sell...`));
      console.log(chalk.cyan(`  Signer: ${payer.publicKey.toBase58()}`));
      console.log(chalk.cyan(`  Mint: ${mint}`));

      const connection = new Connection(getRPC(), 'confirmed');
      console.log(chalk.yellow(`[SYSTEM] Fetching Token Balance...`));
      console.log(chalk.red(`❌ [ERROR] Token Swap Implementation Pending`));
    } catch (e: any) {
      console.error(chalk.red(`❌ [ERROR] ${e.message}`));
    }
  });

// --- Transfer Operations ---

program
  .command('transfer <to> <amount_sol>')
  .description('Send native SOL to another address')
  .action(async (to, amount_sol) => {
    try {
      validateAddress(to, 'Recipient');
      const amount = parseFloat(amount_sol);
      if (isNaN(amount) || amount <= 0) throw new Error("Amount must be a positive number.");

      const payer = await loadKeypair();
      const connection = new Connection(getRPC(), 'confirmed');
      const recipient = new PublicKey(to);

      console.log(chalk.yellow(`[SYSTEM] Preparing Transfer...`));
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: recipient,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      const signature = await sendAndConfirmTransaction(connection, tx, [payer]);
      console.log(chalk.green(`✅ Transfer Successful!`));
      console.log(chalk.cyan(`  Signature: ${signature}`));
    } catch (e: any) {
      console.error(chalk.red(`❌ [ERROR] ${e.message}`));
    }
  });

// --- System Operations ---

program
  .command('status')
  .description('Check terminal and swarm connectivity')
  .action(async () => {
    console.log(chalk.white(`[GRID_STATUS] Checking Sovereign Lattice...`));
    const rpc = getRPC();
    const connection = new Connection(rpc, 'confirmed');

    try {
      const slot = await connection.getSlot();
      const version = await connection.getVersion();
      console.log(chalk.cyan(`  Terminal Version: 2.3.0`));
      console.log(chalk.cyan(`  RPC Connection: ${rpc}`));
      console.log(chalk.cyan(`  Solana Version: ${version['solana-core']}`));
      console.log(chalk.cyan(`  Current Slot: ${slot}`));

      try {
        const payer = await loadKeypair();
        const balance = await connection.getBalance(payer.publicKey);
        console.log(chalk.green(`  Lattice Status: OPERATIONAL`));
        console.log(chalk.green(`  Signer: ${payer.publicKey.toBase58()} (${balance / LAMPORTS_PER_SOL} SOL)`));
      } catch {
        console.log(chalk.yellow(`  Lattice Status: DEGRADED (No Signer Found)`));
      }
    } catch (e: any) {
      console.log(chalk.red(`  Lattice Status: DISCONNECTED (${e.message})`));
    }
  });

program.parse();
