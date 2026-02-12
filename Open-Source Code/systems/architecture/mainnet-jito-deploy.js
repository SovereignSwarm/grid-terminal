/**
 * 🦅 SOVEREIGN SWARM: $GRID Mainnet Jito-Bundle Deployment Script
 * Version: 2.0.0
 * 
 * FEATURES:
 * - Token-2022 Standard
 * - 1% Transfer Fee (MEV-protected)
 * - On-chain Metadata
 * - Jito MEV Bundle Integration (Atomic Launch)
 * - Vault-based Security
 * 
 * Usage:
 *   node mainnet-jito-deploy.js           # Dry run
 *   node mainnet-jito-deploy.js --execute # LIVE Mainnet Broadcast
 */

const { 
    Connection, 
    Keypair, 
    SystemProgram, 
    Transaction, 
    PublicKey, 
    LAMPORTS_PER_SOL 
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
    getMintLen,
    TYPE_SIZE,
    LENGTH_SIZE
} = require('@solana/spl-token');
const { 
    createInitializeInstruction, 
    createUpdateFieldInstruction,
    pack 
} = require('@solana/spl-token-metadata');
const fs = require('fs');
const path = require('path');
const bs58 = require('bs58');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    name: 'The Grid',
    symbol: 'GRID',
    decimals: 9,
    transferFeeBasisPoints: 100, // 1%
    maxTransferFee: BigInt(5000) * BigInt(10 ** 9), // 5000 GRID cap
    metadataUri: 'https://raw.githubusercontent.com/SovereignSwarm/grid-terminal/master/docs/metadata.json',
    
    // Distribution
    founderWallet: 'BGSafo9zLsFhYtwsP6Z7TwWjfq9o18KtrCmskVcr8PuV', // CEO/Board
    founderAmount: BigInt(75_000_000) * BigInt(10 ** 9),   // 75M
    deployerAmount: BigInt(925_000_000) * BigInt(10 ** 9), // 925M
    
    // Networking
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    jitoBlockEngine: 'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
    jitoTipAccounts: [
        '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
        'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
        'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
        'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
        'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
        'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
        '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
        'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL'
    ],
    jitoTipAmount: 0.005, // 0.005 SOL tip for priority inclusion
    
    vaultPath: path.resolve('systems/auth/vault.json'),
};

// ============================================================================
// UTILITIES
// ============================================================================

function loadDeployer() {
    try {
        const vault = JSON.parse(fs.readFileSync(CONFIG.vaultPath, 'utf8'));
        const pkArray = vault.solana?.deployer_pk;
        if (!pkArray) throw new Error("Missing solana.deployer_pk in vault");
        return Keypair.fromSecretKey(Uint8Array.from(pkArray));
    } catch (e) {
        console.error(`❌ CRITICAL: Vault Access Failed. ${e.message}`);
        process.exit(1);
    }
}

async function sendJitoBundle(transactions) {
    console.log(`🚀 Preparing Jito Bundle with ${transactions.length} transactions...`);
    
    const bundlePayload = {
        jsonrpc: "2.0",
        id: 1,
        method: "sendBundle",
        params: [
            transactions.map(tx => bs58.encode(tx.serialize()))
        ]
    };

    const response = await fetch(CONFIG.jitoBlockEngine, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bundlePayload)
    });

    const result = await response.json();
    if (result.error) {
        throw new Error(`Jito Bundle Error: ${JSON.stringify(result.error)}`);
    }
    return result.result;
}

// ============================================================================
// MAIN DEPLOYMENT
// ============================================================================

async function run() {
    const isExecute = process.argv.includes('--execute');
    const deployer = loadDeployer();
    const connection = new Connection(CONFIG.rpcUrl, 'confirmed');
    
    console.log(`\n🦅 SOVEREIGN $GRID DEPLOYMENT`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Deployer: ${deployer.publicKey.toBase58()}`);
    console.log(`Network:  Mainnet-Beta`);
    console.log(`Mode:     ${isExecute ? 'LIVE' : 'DRY RUN'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    const founderPubkey = new PublicKey(CONFIG.founderWallet);
    
    // 1. Calculate Space and Rent
    const extensions = [ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer];
    const mintLen = getMintLen(extensions);
    
    const metadata = {
        mint: mint,
        name: CONFIG.name,
        symbol: CONFIG.symbol,
        uri: CONFIG.metadataUri,
        additionalMetadata: [],
    };
    
    const metadataLen = pack(metadata).length;
    const totalLen = mintLen + TYPE_SIZE + LENGTH_SIZE + metadataLen;
    const lamports = await connection.getMinimumBalanceForRentExemption(totalLen);

    console.log(`🔍 Mint Address: ${mint.toBase58()}`);
    console.log(`📊 Total Space: ${totalLen} bytes`);
    console.log(`💰 Rent Required: ${lamports / LAMPORTS_PER_SOL} SOL`);

    // 2. Build Transaction 1: Create Mint & Initialize
    const latestBlockhash = await connection.getLatestBlockhash('finalized');
    
    const tx1 = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: deployer.publicKey,
            newAccountPubkey: mint,
            space: totalLen,
            lamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(
            mint,
            deployer.publicKey,
            deployer.publicKey,
            CONFIG.transferFeeBasisPoints,
            CONFIG.maxTransferFee,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMetadataPointerInstruction(
            mint,
            deployer.publicKey,
            mint,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
            mint,
            CONFIG.decimals,
            deployer.publicKey,
            deployer.publicKey,
            TOKEN_2022_PROGRAM_ID
        ),
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
        createUpdateFieldInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mint,
            updateAuthority: deployer.publicKey,
            field: 'description',
            value: 'Sovereign Infrastructure for the Agentic Economy.'
        })
    );
    tx1.recentBlockhash = latestBlockhash.blockhash;
    tx1.feePayer = deployer.publicKey;
    tx1.sign(deployer, mintKeypair);

    // 3. Build Transaction 2: Distribution (ATAs + MintTo)
    const founderAta = getAssociatedTokenAddressSync(mint, founderPubkey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
    const deployerAta = getAssociatedTokenAddressSync(mint, deployer.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    const tx2 = new Transaction().add(
        createAssociatedTokenAccountInstruction(deployer.publicKey, founderAta, founderPubkey, mint, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(deployer.publicKey, deployerAta, deployer.publicKey, mint, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID),
        createMintToInstruction(mint, founderAta, deployer.publicKey, CONFIG.founderAmount, [], TOKEN_2022_PROGRAM_ID),
        createMintToInstruction(mint, deployerAta, deployer.publicKey, CONFIG.deployerAmount, [], TOKEN_2022_PROGRAM_ID)
    );
    tx2.recentBlockhash = latestBlockhash.blockhash;
    tx2.feePayer = deployer.publicKey;
    tx2.sign(deployer);

    // 4. Build Transaction 3: Jito Tip
    const tipAccount = new PublicKey(CONFIG.jitoTipAccounts[Math.floor(Math.random() * CONFIG.jitoTipAccounts.length)]);
    const txTip = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: deployer.publicKey,
            toPubkey: tipAccount,
            lamports: CONFIG.jitoTipAmount * LAMPORTS_PER_SOL
        })
    );
    txTip.recentBlockhash = latestBlockhash.blockhash;
    txTip.feePayer = deployer.publicKey;
    txTip.sign(deployer);

    // 5. Simulation Check
    console.log(`🔬 Simulating transactions...`);
    const sim1 = await connection.simulateTransaction(tx1);
    if (sim1.value.err) throw new Error(`Tx1 Simulation Failed: ${JSON.stringify(sim1.value.err)}`);
    console.log(`✅ Tx1 Simulation Passed`);

    const sim2 = await connection.simulateTransaction(tx2);
    if (sim2.value.err) throw new Error(`Tx2 Simulation Failed: ${JSON.stringify(sim2.value.err)}`);
    console.log(`✅ Tx2 Simulation Passed`);

    if (!isExecute) {
        console.log(`\n🧪 DRY RUN COMPLETE`);
        console.log(`- Bundle would contain 3 transactions.`);
        console.log(`- Mint: ${mint.toBase58()}`);
        console.log(`- Founder ATA: ${founderAta.toBase58()}`);
        console.log(`- Deployer ATA: ${deployerAta.toBase58()}`);
        console.log(`- Jito Tip: ${CONFIG.jitoTipAmount} SOL to ${tipAccount.toBase58()}`);
        
        console.log(`\nRun with --execute to broadcast to Mainnet.`);
        
        // Save mint keypair for the real run
        const keyPath = path.join(process.cwd(), `mint-${mint.toBase58()}.json`);
        fs.writeFileSync(keyPath, JSON.stringify(Array.from(mintKeypair.secretKey)));
        console.log(`💾 Mint keypair saved to ${keyPath}`);
        return;
    }

    // 6. Execute Bundle
    try {
        console.log(`📡 Broadcasting bundle to Jito...`);
        const bundleId = await sendJitoBundle([tx1, tx2, txTip]);
        console.log(`✅ Bundle Sent! ID: ${bundleId}`);
        console.log(`👀 Monitor: https://explorer.jito.wtf/bundle/${bundleId}`);
        console.log(`🔗 Token Address: https://solscan.io/token/${mint.toBase58()}`);
    } catch (e) {
        console.error(`❌ Deployment Failed: ${e.message}`);
    }
}

run().catch(console.error);
