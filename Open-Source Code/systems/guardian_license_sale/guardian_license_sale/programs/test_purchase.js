const anchor = require('@coral-xyz/anchor');
const { PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

async function main() {
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
    const walletPath = "/home/jorqu/.config/solana/id.json";
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')));
    const testWallet = Keypair.fromSecretKey(secretKey);
    const wallet = new anchor.Wallet(testWallet);
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    anchor.setProvider(provider);

    const idlPath = path.resolve(__dirname, "./target/idl/guardian_license_sale.json");
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
    const programId = new PublicKey("FfA1sZdQcEps96tMhNKxwu1s3MaLx86wMHCGigKUAtpm");
    const program = new anchor.Program(idl, provider);

    const [saleState] = PublicKey.findProgramAddressSync([Buffer.from("sale_state")], programId);
    const asset = Keypair.generate();
    const treasury = new PublicKey("HYjgAnd9Vb8XKRTTnUqMLnX8SEbqeV8oApsvXWqiphF2");

    // Using a random Keypair for collection to satisfy 'writable' constraint for this test
    const dummyCollection = Keypair.generate();
    const coreProgram = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

    console.log("Attempting out-of-bounds Purchase (Tier 5)...");

    try {
        const tx = await program.methods
            .purchaseLicenseSol(5) // Index 5 doesn't exist (0-4 are valid)
            .accounts({
                saleState: saleState,
                buyer: testWallet.publicKey,
                payer: testWallet.publicKey,
                treasuryInfo: treasury,
                asset: asset.publicKey,
                collection: dummyCollection.publicKey, // Now writable (as a keypair with no data)
                coreProgram: coreProgram,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .signers([asset])
            .rpc();

        console.log("Purchase Transaction Signature:", tx);
    } catch (err) {
        console.log("Expected Error Received:", err.message);
        if (err.message.includes("InvalidTierIndex")) {
            console.log("✅ VERIFIED: We are talking to the Guardian Node Sale contract!");
        } else {
            console.error("❌ Unexpected Error:", err);
        }
    }
}

main();
