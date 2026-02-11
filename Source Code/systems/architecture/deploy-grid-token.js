/**
 * $GRID Token Deployment - Transfer Fee 2% (Fee Only, No Hook for Token-2022 compatibility)
 */

const {
    Connection, Keypair, SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL, sendAndConfirmTransaction
} = require('@solana/web3.js');
const {
    ExtensionType, TOKEN_2022_PROGRAM_ID, createInitializeMintInstruction,
    createInitializeTransferFeeConfigInstruction, createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID, getMintLen,
    createMintToInstruction
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    name: 'The Grid',
    symbol: 'GRID',
    decimals: 9,
    transferFeeBasisPoints: 200,
    maxTransferFee: BigInt(10_000_000) * BigInt(10 ** 9), // 10M max fee
    founderWallet: 'BGSafo9zLsFhYtwsP6Z7TwWjfq9o18KtrCmskVcr8PuV',
    founderAmount: BigInt(100_000_000) * BigInt(10 ** 9), // 100M
    deployerAmount: BigInt(900_000_000) * BigInt(10 ** 9), // 900M
    rpcUrl: 'https://api.devnet.solana.com',
    vaultPath: path.resolve(__dirname, '../../../systems/auth/vault.json'),
};

function loadDeployer() {
    try {
        if (fs.existsSync(CONFIG.vaultPath)) {
            const vault = JSON.parse(fs.readFileSync(CONFIG.vaultPath, 'utf8'));
            if (vault.solana?.deployer_pk) {
                return Keypair.fromSecretKey(Uint8Array.from(vault.solana.deployer_pk));
            }
        }
        console.error('❌ No deployer key found in vault');
        process.exit(1);
    } catch (e) {
        console.error(`❌ Key Load Failed: ${e.message}`);
        process.exit(1);
    }
}

async function run() {
    const isExecute = process.argv.includes('--execute');
    const deployer = loadDeployer();
    const connection = new Connection(CONFIG.rpcUrl, 'confirmed');
    
    console.log(`\n🦅 $GRID DEVNET DEPLOYMENT`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Deployer: ${deployer.publicKey.toBase58()}`);
    console.log(`Mode: ${isExecute ? 'LIVE' : 'DRY RUN'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;
    const founderPubkey = new PublicKey(CONFIG.founderWallet);
    
    // Extensions: Transfer Fee only (no metadata for now)
    const extensions = [ExtensionType.TransferFeeConfig];
    const mintLen = getMintLen(extensions);
    const rent = await connection.getMinimumBalanceForRentExemption(mintLen + 256); // buffer

    console.log(`🔍 Mint: ${mint.toBase58()}`);
    console.log(`📦 Space: ${mintLen} bytes`);
    console.log(`💰 Rent: ${rent / LAMPORTS_PER_SOL} SOL`);

    // Transaction 1: Create account + initialize extensions + mint
    const tx = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: deployer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: rent,
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
        createInitializeMintInstruction(
            mint,
            CONFIG.decimals,
            deployer.publicKey,
            null,
            TOKEN_2022_PROGRAM_ID
        )
    );

    // Create ATAs and mint
    const founderAta = getAssociatedTokenAddressSync(mint, founderPubkey, false, TOKEN_2022_PROGRAM_ID);
    const deployerAta = getAssociatedTokenAddressSync(mint, deployer.publicKey, false, TOKEN_2022_PROGRAM_ID);
    
    const tx2 = new Transaction().add(
        createAssociatedTokenAccountInstruction(deployer.publicKey, founderAta, founderPubkey, mint, TOKEN_2022_PROGRAM_ID),
        createAssociatedTokenAccountInstruction(deployer.publicKey, deployerAta, deployer.publicKey, mint, TOKEN_2022_PROGRAM_ID),
        createMintToInstruction(mint, founderAta, deployer.publicKey, CONFIG.founderAmount, [], TOKEN_2022_PROGRAM_ID),
        createMintToInstruction(mint, deployerAta, deployer.publicKey, CONFIG.deployerAmount, [], TOKEN_2022_PROGRAM_ID)
    );

    if (!isExecute) {
        console.log(`\n🧪 DRY RUN COMPLETE`);
        console.log(`- Mint: ${mint.toBase58()}`);
        console.log(`Run with --execute to deploy`);
        return;
    }

    console.log(`📡 Sending Transaction 1...`);
    const sig1 = await sendAndConfirmTransaction(connection, tx, [deployer, mintKeypair]);
    console.log(`✅ Tx1: ${sig1}`);

    console.log(`📡 Sending Transaction 2...`);
    const sig2 = await sendAndConfirmTransaction(connection, tx2, [deployer]);
    console.log(`✅ Tx2: ${sig2}`);

    console.log(`\n🎉 SUCCESS!`);
    console.log(`🔗 Token: https://solscan.io/token/${mint.toBase58()}?cluster=devnet`);
    
    fs.writeFileSync('grid-token-devnet.json', JSON.stringify({
        mint: mint.toBase58(),
        tx1: sig1,
        tx2: sig2,
        founderAta: founderAta.toBase58(),
        deployerAta: deployerAta.toBase58()
    }, null, 2));

    console.log(`💾 Saved to grid-token-devnet.json`);
}

run().catch(console.error);
