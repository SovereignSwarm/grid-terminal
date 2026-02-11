import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction,
    SystemProgram,
    SYSVAR_RENT_PUBKEY
} from "@solana/web3.js";
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

// CLI Arguments
const args = process.argv.slice(2);
const getArg = (key: string) => {
    const idx = args.indexOf(key);
    return idx !== -1 ? args[idx + 1] : null;
};

const MINT_ADDR = getArg('--mint');
const HOOK_PID = getArg('--hook-pid');
const PAYER_PATH = getArg('--payer');
const RPC_URL = getArg('--rpc') || "https://api.devnet.solana.com";

if (!MINT_ADDR || !HOOK_PID || !PAYER_PATH) {
    console.error("Usage: ts-node init_hook.ts --mint <PUBKEY> --hook-pid <PUBKEY> --payer <PATH> [--rpc <URL>]");
    process.exit(1);
}

// Helper: Anchor Discriminator
function getDiscriminator(name: string): Buffer {
    const hash = createHash('sha256').update(`global:${name}`).digest();
    return hash.subarray(0, 8);
}

async function main() {
    console.log("🔗 Initializing Transfer Hook ExtraAccountMetaList...");

    // 1. Setup Connection & Wallet
    const connection = new Connection(RPC_URL, "confirmed");
    const payerKeypair = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(PAYER_PATH, 'utf-8')))
    );
    console.log(`Wallet: ${payerKeypair.publicKey.toBase58()}`);

    // 2. Derive PDAs
    const mint = new PublicKey(MINT_ADDR);
    const programId = new PublicKey(HOOK_PID);

    const [extraAccountMetaListPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("extra-account-metas"), mint.toBuffer()],
        programId
    );
    console.log(`PDA (ExtraAccountMetaList): ${extraAccountMetaListPDA.toBase58()}`);

    // 3. Construct Instruction
    // Instruction: initialize_extra_account_meta_list
    const discriminator = getDiscriminator("initialize_extra_account_meta_list");

    // Accounts (matches lib.rs Context):
    // 0. payer (Signer, Mut)
    // 1. extra_account_meta_list (Mut)
    // 2. mint (Read)
    // 3. token_program (Read)
    // 4. associated_token_program (Read)
    // 5. system_program (Read)

    const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
    const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

    const ix = new TransactionInstruction({
        keys: [
            { pubkey: payerKeypair.publicKey, isSigner: true, isWritable: true },
            { pubkey: extraAccountMetaListPDA, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: programId,
        data: discriminator // No arguments, just discriminator
    });

    // 4. Send Transaction
    const tx = new Transaction().add(ix);
    console.log("Sending transaction...");

    try {
        const signature = await sendAndConfirmTransaction(connection, tx, [payerKeypair], {
            skipPreflight: true,
            commitment: "confirmed"
        });
        console.log(`✅ Success! Tx: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    } catch (e: any) {
        console.error("❌ Transaction Failed:");
        console.error(e);
        if (e.logs) {
            console.error("Logs:", e.logs);
        }
    }
}

main();
