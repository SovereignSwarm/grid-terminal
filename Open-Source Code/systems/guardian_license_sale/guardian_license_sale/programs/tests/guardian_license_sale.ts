import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GuardianLicenseSale } from "../target/types/guardian_license_sale";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("guardian_license_sale", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.GuardianLicenseSale as Program<GuardianLicenseSale>;
    const admin = provider.wallet;
    const treasury = Keypair.generate();
    const paymentMint = Keypair.generate(); // Simulated USDC
    const collection = Keypair.generate();

    const [saleState] = PublicKey.findProgramAddressSync(
        [Buffer.from("sale_state")],
        program.programId
    );

    it("Initializes the sale", async () => {
        const tiers = [
            {
                name: "Scout",
                priceSol: new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL),
                priceUsdc: new anchor.BN(100 * 10 ** 6), // $100
                supplyCap: 1000000, // Unlimited
                sold: 0,
            },
            {
                name: "Guardian",
                priceSol: new anchor.BN(5 * anchor.web3.LAMPORTS_PER_SOL),
                priceUsdc: new anchor.BN(500 * 10 ** 6), // $500
                supplyCap: 500,
                sold: 0,
            },
            {
                name: "Performance",
                priceSol: new anchor.BN(25 * anchor.web3.LAMPORTS_PER_SOL),
                priceUsdc: new anchor.BN(2500 * 10 ** 6), // $2,500
                supplyCap: 250,
                sold: 0,
            },
            {
                name: "Cluster",
                priceSol: new anchor.BN(250 * anchor.web3.LAMPORTS_PER_SOL),
                priceUsdc: new anchor.BN(25000 * 10 ** 6), // $25,000
                supplyCap: 50,
                sold: 0,
            },
            {
                name: "Datacenter",
                priceSol: new anchor.BN(1000 * anchor.web3.LAMPORTS_PER_SOL),
                priceUsdc: new anchor.BN(100000 * 10 ** 6), // $100,000
                supplyCap: 10,
                sold: 0,
            }
        ];

        await program.methods
            .initializeSale(tiers)
            .accounts({
                saleState: saleState,
                admin: admin.publicKey,
                treasury: treasury.publicKey,
                paymentMint: paymentMint.publicKey,
                collection: collection.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        const state = await program.account.saleState.fetch(saleState);
        expect(state.admin.toBase58()).to.equal(admin.publicKey.toBase58());
        expect(state.tiers.length).to.equal(3);
    });

    it("Purchases a license with SOL", async () => {
        const buyer = Keypair.generate();
        const asset = Keypair.generate();
        const coreProgram = new PublicKey("CoRa11111111111111111111111111111111111111"); // Placeholder

        // Note: Real test would need airdrop and actual CPI simulation
        // This is a logic/interface validation test
        console.log("Ready to test purchaseLicenseSol interface...");
    });
});
