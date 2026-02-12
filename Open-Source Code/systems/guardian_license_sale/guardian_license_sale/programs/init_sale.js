const anchor = require('@coral-xyz/anchor');
const { PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

async function main() {
    // 1. Setup Connection and Provider
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");

    // Admin Keypair (Bootstrap Admin)
    const adminKeypairPath = path.resolve(__dirname, "../../../GRID_REPORT/04_SECURITY_KEYS/CRITICAL_KEYS_DO_NOT_SHARE/deployer-key.json");
    const adminKeypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(fs.readFileSync(adminKeypairPath, 'utf-8')))
    );

    const wallet = new anchor.Wallet(adminKeypair);
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    anchor.setProvider(provider);

    // 2. Load IDL
    const idlPath = path.resolve(__dirname, "./target/idl/guardian_license_sale.json");
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

    // 3. Setup Program
    const programId = new PublicKey("FfA1sZdQcEps96tMhNKxwu1s3MaLx86wMHCGigKUAtpm");
    const program = new anchor.Program(idl, provider);

    // 4. State Management
    const [saleState] = PublicKey.findProgramAddressSync(
        [Buffer.from("sale_state")],
        programId
    );

    console.log("Sale State PDA:", saleState.toBase58());

    // 5. Configuration (Matching UI Tiers in GuardianNodeSale.svelte)
    const treasury = new PublicKey("HYjgAnd9Vb8XKRTTnUqMLnX8SEbqeV8oApsvXWqiphF2");
    const paymentMint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC
    const collection = new PublicKey("FfA1sZdQcEps96tMhNKxwu1s3MaLx86wMHCGigKUAtpm"); // Self as dummy

    const tiers = [
        {
            name: "Network Scout",
            priceSol: new anchor.BN(1 * 1000000000), // 1 SOL
            priceUsdc: new anchor.BN(100 * 1000000),  // 100 USDC
            supplyCap: 10000, // Unlimited (High Cap)
            sold: 0
        },
        {
            name: "Genesis Guardian",
            priceSol: new anchor.BN(5 * 1000000000), // 5 SOL
            priceUsdc: new anchor.BN(500 * 1000000),  // 500 USDC
            supplyCap: 500,
            sold: 0
        },
        {
            name: "Performance Node",
            priceSol: new anchor.BN(25 * 1000000000), // 25 SOL
            priceUsdc: new anchor.BN(2500 * 1000000), // 2500 USDC
            supplyCap: 250,
            sold: 0
        },
        {
            name: "Validator Cluster",
            priceSol: new anchor.BN(250 * 1000000000), // 250 SOL
            priceUsdc: new anchor.BN(25000 * 1000000), // 25000 USDC
            supplyCap: 50,
            sold: 0
        },
        {
            name: "Sovereign Datacenter",
            priceSol: new anchor.BN(1000 * 1000000000), // 1000 SOL
            priceUsdc: new anchor.BN(100000 * 1000000), // 100000 USDC
            supplyCap: 10,
            sold: 0
        }
    ];

    const baseUri = "https://metadata.sovereignswarm.com/guardian/";

    // 6. Check if already initialized
    try {
        await program.account.saleState.fetch(saleState);
        console.log("Program already initialized. Updating tiers instead...");

        const tx = await program.methods
            .updateTiers(tiers)
            .accounts({
                saleState: saleState,
                admin: adminKeypair.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        console.log("Tiers Update Transaction Signature:", tx);
        console.log("✅ Success! Tiers updated to match UI.");

    } catch (err) {
        console.log("Initializing Guardian License Sale for the first time...");
        const tx = await program.methods
            .initializeSale(tiers, baseUri)
            .accounts({
                saleState: saleState,
                admin: adminKeypair.publicKey,
                treasury: treasury,
                paymentMint: paymentMint,
                collection: collection,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        console.log("Initialization Transaction Signature:", tx);
        console.log("✅ Success! Guardian Node Sale initialized on Devnet.");
    }
}

main();
