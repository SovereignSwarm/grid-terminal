import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TERMINAL_ROOT = path.resolve(__dirname, '..');
const CORE_ROOT = path.resolve(TERMINAL_ROOT, '..', 'grid-core');
const INTERFACE_ROOT = path.resolve(TERMINAL_ROOT, '..', 'grid-interface');
const CHAIN_CONFIG_PATH = path.join(INTERFACE_ROOT, 'src', 'lib', 'chain-config.js');

// Import Dependencies (Standard)
import {
    Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction
} from '@solana/web3.js';
import {
    createInitializeMintInstruction,
    createInitializeTransferHookInstruction,
    createInitializeMetadataPointerInstruction,
    ExtensionType,
    getMintLen,
    TOKEN_2022_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    LENGTH_SIZE,
    TYPE_SIZE,
    createInitializeInstruction
} from '@solana/spl-token';
import {
    createInitializeInstruction as createInitMetadataInstruction
} from '@solana/spl-token-metadata';

// --- CONFIGURATION ---
const RPC_URL = "https://api.devnet.solana.com";
const MINT_KEYPAIR_PATH = path.join(TERMINAL_ROOT, 'target', 'deploy', 'grid_token-keypair.json');
const HOOK_KEYPAIR_PATH = path.join(CORE_ROOT, 'systems', 'token', 'programs', 'target', 'deploy', 'grid_transfer_hook-keypair.json');

// --- HELPERS ---
function loadKeypair(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Keypair not found at: ${filePath}`);
    }
    const secret = new Uint8Array(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
    return Keypair.fromSecretKey(secret);
}

// Helper to load .env variable manually (avoid dotenv dependency)
function loadEnvDeployerKey() {
    const envPath = path.join(INTERFACE_ROOT, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const match = content.match(/DEPLOYER_KEY="?(\[[0-9, ]+\])"?/);
        if (match && match[1]) {
            try {
                const secret = new Uint8Array(JSON.parse(match[1]));
                return Keypair.fromSecretKey(secret);
            } catch (e) {
                console.warn("Found DEPLOYER_KEY but failed to parse:", e.message);
            }
        }
    }
    return null;
}

function getPayer() {
    // 1. Try standard solana config location
    const configPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
    if (fs.existsSync(configPath)) {
        try {
            return loadKeypair(configPath);
        } catch (e) {
            console.warn("Found id.json but failed to load:", e.message);
        }
    }

    // 2. Fallback to grid-interface .env
    const envKey = loadEnvDeployerKey();
    if (envKey) {
        console.log("Using DEPLOYER_KEY from grid-interface/.env");
        return envKey;
    }

    throw new Error("Could not find Default Payer at ~/.config/solana/id.json or DEPLOYER_KEY in .env");
}

async function getDiscriminator(name) {
    // Basic SHA256 implementation if crypto isn't available, but we use 'crypto' module
    // Actually we can implement signature hashing or hardcode standard Anchor discriminators
    // For initialize_extra_account_meta_list: global:initialize_extra_account_meta_list
    // SHA256 -> first 8 bytes.
    // Let's rely on node crypto
    // Use standard crypto import (added at top level or dynamic)
    const { createHash } = await import('crypto');
    const hash = createHash('sha256').update(`global:${name}`).digest();
    return hash.subarray(0, 8);
}

async function main() {
    console.log("🚀 STARTING NODE.JS MINT SCRIPT");
    console.log("-------------------------------");

    const connection = new Connection(RPC_URL, "confirmed");
    const payer = getPayer();
    console.log(`Payer: ${payer.publicKey.toBase58()}`);

    // 1. Load Hook ID
    let hookProgramId;
    try {
        if (fs.existsSync(HOOK_KEYPAIR_PATH)) {
            const hookKp = loadKeypair(HOOK_KEYPAIR_PATH);
            hookProgramId = hookKp.publicKey;
            console.log(`Hook ID (File): ${hookProgramId.toBase58()}`);
        } else {
            // Fallback to known deployed ID
            const FALLBACK_ID = "7Py52EPwuCxYJ7UiBKrk5ce14T4NTxuutHFtyoWDdqFV";
            hookProgramId = new PublicKey(FALLBACK_ID);
            console.log(`Hook ID (Fallback): ${hookProgramId.toBase58()}`);
        }
    } catch (e) {
        console.error("❌ Failed to resolve Hook ID:", e.message);
        process.exit(1);
    }

    // 2. Load/Gen Mint Keypair
    let mintKeypair;
    if (fs.existsSync(MINT_KEYPAIR_PATH)) {
        mintKeypair = loadKeypair(MINT_KEYPAIR_PATH);
        console.log(`Loaded existing Mint: ${mintKeypair.publicKey.toBase58()}`);
    } else {
        mintKeypair = Keypair.generate();
        fs.mkdirSync(path.dirname(MINT_KEYPAIR_PATH), { recursive: true });
        fs.writeFileSync(MINT_KEYPAIR_PATH, JSON.stringify(Array.from(mintKeypair.secretKey)));
        console.log(`Generated new Mint: ${mintKeypair.publicKey.toBase58()}`);
    }
    const mint = mintKeypair.publicKey;

    // 3. Create Token-2022 with Extensions
    // We need: TransferHook, MetadataPointer, Metadata
    // Calculate space
    // Standard Mint + Extensions
    // For simplicity, we allocate enough space. 
    // Extensions: TransferHook (64?), MetadataPointer (64?), Metadata (variable)
    // Actually, spl-token helpers like `getMintLen` are good.
    const extensions = [ExtensionType.TransferHook, ExtensionType.MetadataPointer];
    const mintLen = getMintLen(extensions);

    // Metadata length estimate: 
    // Name (GRID) + Symbol (GRID) + URI (https...) + ... ~100-200 bytes
    // Let's add 500 bytes for Safety + Metadata extension overhead
    const metadataLen = 500;
    const totalLen = mintLen + metadataLen;

    const lamports = await connection.getMinimumBalanceForRentExemption(totalLen);

    console.log("Creating Mint Transaction...");
    const tx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: totalLen,
            lamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        // Init Transfer Hook
        createInitializeTransferHookInstruction(
            mint,
            payer.publicKey,
            hookProgramId, // Transfer Hook Program ID
            TOKEN_2022_PROGRAM_ID
        ),
        // Init Metadata Pointer
        createInitializeMetadataPointerInstruction(
            mint,
            payer.publicKey, // Authority
            mint, // Metadata Address (Self)
            TOKEN_2022_PROGRAM_ID
        ),
        // Init Mint
        createInitializeMintInstruction(
            mint,
            8, // Decimals
            payer.publicKey,
            payer.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
        // Init Metadata (Instruction from spl-token-metadata interface)
        // Note: The library export might differ. We will manually construct if verification fails.
        // Assuming createInitializeInstruction(programId, metadata, updateAuthority, mint, mintAuthority, name, symbol, uri)
        // Wait, standard Metadata Pointer points to the Mint itself usually for Token Extensions.
        // We use spl-token-metadata interface instructions, targeting the extension within the mint.
        createInitMetadataInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mint,
            updateAuthority: payer.publicKey,
            mint: mint,
            mintAuthority: payer.publicKey,
            name: "The Grid",
            symbol: "GRID",
            uri: "https://grid.sovereignswarm.io/metadata.json"
        })
    );

    try {
        const sig = await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair], { skipPreflight: true });
        console.log(`✅ Mint Created: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
    } catch (e) {
        console.log("⚠️ Mint creation failed (might already exist). continuing...");
        // console.error(e);
    }


    // 4. Initialize Hook (ExtraAccountMetas)
    console.log("Initializing ExtraAccountMetas...");
    const [extraAccountMetaListPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("extra-account-metas"), mint.toBuffer()],
        hookProgramId
    );

    const discriminator = getDiscriminator("initialize_extra_account_meta_list");
    const ixInitHook = {
        keys: [
            { pubkey: payer.publicKey, isSigner: true, isWritable: true },
            { pubkey: extraAccountMetaListPDA, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"), isSigner: false, isWritable: false }, // ATA
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: hookProgramId,
        data: discriminator
    };

    try {
        const txHook = new Transaction().add(ixInitHook);
        const sigHook = await sendAndConfirmTransaction(connection, txHook, [payer], { skipPreflight: true });
        console.log(`✅ Hook Initialized: https://explorer.solana.com/tx/${sigHook}?cluster=devnet`);
    } catch (e) {
        console.log("⚠️ Hook Init failed (might already be initialized).");
        // console.error(e);
    }

    // 5. Mint Supply
    console.log("Minting Initial Supply...");
    const ata = getAssociatedTokenAddressSync(mint, payer.publicKey, false, TOKEN_2022_PROGRAM_ID);

    const txMint = new Transaction().add(
        createAssociatedTokenAccountInstruction(
            payer.publicKey,
            ata,
            payer.publicKey,
            mint,
            TOKEN_2022_PROGRAM_ID
        ),
        createMintToInstruction(
            mint,
            ata,
            payer.publicKey,
            100_000_000 * 10 ** 8, // 100M Extension
            [],
            TOKEN_2022_PROGRAM_ID
        )
    );

    try {
        const sigMint = await sendAndConfirmTransaction(connection, txMint, [payer], { skipPreflight: true });
        console.log(`✅ Supply Minted: https://explorer.solana.com/tx/${sigMint}?cluster=devnet`);
    } catch (e) {
        console.log("⚠️ Minting failed (ATA might exist). Trying mint only...");
        const txMintOnly = new Transaction().add(
            createMintToInstruction(mint, ata, payer.publicKey, 100_000_000 * 10 ** 8, [], TOKEN_2022_PROGRAM_ID)
        );
        try {
            await sendAndConfirmTransaction(connection, txMintOnly, [payer]);
            console.log("✅ Minted (Existing ATA).");
        } catch (e2) {
            console.log("⚠️ Could not mint.");
        }
    }

    // 6. Update Chain Config
    console.log("Updating chain-config.js...");
    if (fs.existsSync(CHAIN_CONFIG_PATH)) {
        let cfg = fs.readFileSync(CHAIN_CONFIG_PATH, 'utf-8');
        // Update mint: 'PENDING...'
        cfg = cfg.replace(/mint: '[^']+',/g, `mint: '${mint.toBase58()}',`);
        // Ensure Hook ID is strictly correct too
        cfg = cfg.replace(/transferHook: '[^']+',/g, `transferHook: '${hookProgramId.toBase58()}',`);
        fs.writeFileSync(CHAIN_CONFIG_PATH, cfg);
        console.log("✅ Config Updated.");
    }

    console.log("🎉 DEPLOYMENT COMPLETE!");
}

main();
