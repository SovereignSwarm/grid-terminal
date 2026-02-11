/**
 * 🦅 SOVEREIGN SWARM: Simple $GRID Devnet Deployment (Transfer Fee Only)
 * Version: 1.0.0
 * 
 * FEATURES:
 * - Token-2022 Standard
 * - 2% Transfer Fee (Native Extension)
 * - On-chain Metadata (optional)
 * 
 * Usage:
 *   node deploy-simple-token.js           # Dry run
 *   node deploy-simple-token.js --execute # LIVE Devnet Broadcast
 */

const { 
    Connection, 
    Keypair, 
    SystemProgram, 
    Transaction, 
    PublicKey, 
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction
} = require('@solana/web3.js');
const { 
    ExtensionType, 
    TOKEN_2022_PROGRAM_ID, 
    createInitializeMintInstruction, 
    createInitializeTransferFeeConfigInstruction, 
    createInitializeMetadataPointerInstruction, 
    createMintToInstruction, 
    createAssociatedTokenAccountInstruction, 
    getAssociatedTokenAddressSync, 
    ASSOCIATED_TOKEN_PROGRAM_ID, 
    getMintLen
} = require('@solana/spl-token');
const { 
    createInitializeInstruction, 
    createUpdateFieldInstruction,
    pack 
} = require('@solana/spl-token-metadata');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    name: 'The Grid',
    symbol: 'GRID',
    decimals: 9,
    transferFeeBasisPoints: 200, // 2% Native Tax
    maxTransferFee: BigInt(100_000_000) * BigInt(10 ** 9), // Effectively unlimited cap (10% of supply)
    metadataUri: 'https://raw.githubusercontent.com/SovereignSwarm/grid-terminal/main/docs/metadata.json',
    
    // Distribution
    founderWallet: 'BGSafo9zLsFhYtwsP6Z7TwWjfq9o18KtrCmskVcr8PuV', // CEO/Board
    founderAmount: BigInt(75_000_000) * BigInt(10 ** 9),   // 75M
    deployerAmount: BigInt(925_000_000) * BigInt(10 ** 9), // 925M
    
    // Networking
    rpcUrl: 'https://api.devnet.solana.com',

    vaultPath: path.resolve(__dirname, '../../../Grid-Private/auth/vault.json'),
};

// ============================================================================
// UTILITIES
// ============================================================================

function loadDeployer() {
    try {
        // Try to load from vault first
        if (fs.existsSync(CONFIG.vaultPath)) {
            const vault = JSON.parse(fs.readFileSync(CONFIG.vaultPath, 'utf8'));
            const pkArray = vault.solana?.deployer_pk;
            if (pkArray) return Keypair.fromSecretKey(Uint8Array.from(pkArray));
        }
        
        // Fallback: Check for local devnet keypair
        const localKeyPath = path.join(process.cwd(), 'devnet-deployer.json');
        if (fs.existsSync(localKeyPath)) {
            const secretKey = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
            return Keypair.fromSecretKey(Uint8Array.from(secretKey));
        }

        // Generate temporary if neither exists (for dry run)
        console.warn("⚠️ No deployer key found. Generating temporary keypair for dry run.");
        return Keypair.generate();
    } catch (e) {
        console.error(`❌ Key Load Failed: ${e.message}`);
        process.exit(1);
    }
}

// ============================================================================
// MAIN DEPLOYMENT
// ============================================================================

async function run() {
    const isExecute = process.argv.includes('--execute');
    const deployer = loadDeployer();
    const connection = new Connection(CONFIG.rpcUrl, 'confirmed');
    
    console.log(`\n🦅 SOVEREIGN $GRID DEVNET DEPLOYMENT (SIMPLE)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Deployer: ${deployer.publicKey.toBase58()}`);
    console.log(`Network:  Devnet`);
    console.log(`Mode:     ${isExecute ? 'LIVE' : 'DRY RUN'}`);
    console.log(`Tax:      2% Native`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    const founderPubkey = new PublicKey(CONFIG.founderWallet);
    
    // 1. Calculate Space and Rent
    const extensions = [
        ExtensionType.TransferFeeConfig, 
        ExtensionType.MetadataPointer
    ];
    const mintLen = getMintLen(extensions);
    
    const metadata = {
        mint: mint,
        name: CONFIG.name,
        symbol: CONFIG.symbol,
        uri: CONFIG.metadataUri,
        additionalMetadata: [],
    };
    
    const TYPE_SIZE = 2;
    const LENGTH_SIZE = 2;
    const metadataLen = pack(metadata).length;
    const totalLen = mintLen + TYPE_SIZE + LENGTH_SIZE + metadataLen;
    const lamports = await connection.getMinimumBalanceForRentExemption(totalLen);

    console.log(`🔍 Mint Address: ${mint.toBase58()}`);
    console.log(`📊 Total Space: ${totalLen} bytes`);
    console.log(`💰 Rent Required: ${lamports / LAMPORTS_PER_SOL} SOL`);

    // 2. Build Transaction 1: Create Mint & Initialize Extensions
    const tx1 = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: deployer.publicKey,
            newAccountPubkey: mint,
            space: totalLen,
            lamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        // Initialize Transfer Fee (2%)
        createInitializeTransferFeeConfigInstruction(
            mint,
            deployer.publicKey, // Authority to update fee
            deployer.publicKey, // Authority to withdraw fee
            CONFIG.transferFeeBasisPoints,
            CONFIG.maxTransferFee,
            TOKEN_2022_PROGRAM_ID
        ),
        // Initialize Metadata Pointer
        createInitializeMetadataPointerInstruction(
            mint,
            deployer.publicKey,
            mint,
            TOKEN_2022_PROGRAM_ID
        ),
        // Initialize Mint
        createInitializeMintInstruction(
            mint,
            CONFIG.decimals,
            deployer.publicKey, // Mint Authority
            null, // Freeze Authority (None)
            TOKEN_2022_PROGRAM_ID
        ),
        // Initialize Metadata
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            mint: mint,
            metadata: mint,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
            mintAuthority: deployer.publicKey,
            updateAuthority: deployer.publicKey,
        }),
        // Add Description
        createUpdateFieldInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mint,
            updateAuthority: deployer.publicKey,
            field: 'description',
            value: 'Sovereign Infrastructure for the Agentic Economy.'
        })
    );

    // 3. Build Transaction 2: Distribution (ATAs + MintTo)
    const founderAta = getAssociatedTokenAddressSync(mint, founderPubkey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const deployerAta = getAssociatedTokenAddressSync(mint, deployer.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    const tx2 = new Transaction().add(
        createAssociatedTokenAccountInstruction(deployer.publicKey, founderAta, founderPubkey, mint, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(deployer.publicKey, deployerAta, deployer.publicKey, mint, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID),
        createMintToInstruction(mint, founderAta, deployer.publicKey, CONFIG.founderAmount, [], TOKEN_2022_PROGRAM_ID),
        createMintToInstruction(mint, deployerAta, deployer.publicKey, CONFIG.deployerAmount, [], TOKEN_2022_PROGRAM_ID)
    );

    if (!isExecute) {
        console.log(`\n🧪 DRY RUN COMPLETE`);
        console.log(`- Mint: ${mint.toBase58()}`);
        console.log(`- Founder ATA: ${founderAta.toBase58()}`);
        console.log(`- Deployer ATA: ${deployerAta.toBase58()}`);
        console.log(`\nRun with --execute to broadcast to Devnet.`);
        return;
    }

    // 4. Execute Transactions
    try {
        console.log(`📡 Sending Transaction 1 (Create Mint)...`);
        const sig1 = await sendAndConfirmTransaction(connection, tx1, [deployer, mintKeypair]);
        console.log(`✅ Tx1 Confirmed: ${sig1}`);

        console.log(`📡 Sending Transaction 2 (Mint & Distribute)...`);
        const sig2 = await sendAndConfirmTransaction(connection, tx2, [deployer]);
        console.log(`✅ Tx2 Confirmed: ${sig2}`);

        console.log(`\n🎉 DEPLOYMENT SUCCESSFUL!`);
        console.log(`🔗 Token: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);
        
        // Save mint keypair
        const keyPath = path.join(process.cwd(), `devnet-mint-${mint.toBase58()}.json`);
        fs.writeFileSync(keyPath, JSON.stringify(Array.from(mintKeypair.secretKey)));
        console.log(`💾 Mint keypair saved to ${keyPath}`);

    } catch (e) {
        console.error(`❌ Deployment Failed: ${e.message}`);
        if (e.logs) {
            console.error("Logs:", e.logs);
        }
    }
}

run().catch(console.error);