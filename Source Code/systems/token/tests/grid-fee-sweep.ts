import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GridFeeSweep } from "../target/types/grid_fee_sweep";
import {
    TOKEN_2022_PROGRAM_ID,
    createMint,
    createAccount,
    mintTo,
    getAccount,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createAssociatedTokenAccount,
} from "@solana/spl-token";
import { expect } from "chai";

describe("grid-fee-sweep", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.GridFeeSweep as Program<GridFeeSweep>;

    // Hardcoded Ops Wallet from lib.rs (Devnet)
    const OPS_WALLET = new anchor.web3.PublicKey("BqPoJnqNLeQZCV5d9YY3Fo2LwFw17fRZbTTkEWGJJRUU");

    let mint: anchor.web3.PublicKey;
    let feeVaultAuthority: anchor.web3.PublicKey;
    let feeVaultTokenAccount: anchor.web3.PublicKey;
    let burnTokenAccount: anchor.web3.PublicKey;
    let opsTokenAccount: anchor.web3.PublicKey;
    let burnAuthority: anchor.web3.PublicKey;

    before(async () => {
        // Airfrop to payer
        // await provider.connection.requestAirdrop(provider.wallet.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    });

    beforeEach(async () => {
        // Create new mint for each test to ensure clean state
        mint = await createMint(
            provider.connection,
            (provider.wallet as any).payer,
            provider.wallet.publicKey,
            null,
            9,
            undefined,
            undefined,
            TOKEN_2022_PROGRAM_ID
        );

        // Derive PDAs
        const [fvAuth] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("fee-vault"), mint.toBuffer()],
            program.programId
        );
        feeVaultAuthority = fvAuth;

        const [bAuth] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from("burn")],
            program.programId
        );
        burnAuthority = bAuth;

        // Derive ATAs
        feeVaultTokenAccount = getAssociatedTokenAddressSync(
            mint,
            feeVaultAuthority,
            true, // allowOwnerOffCurve (PDA)
            TOKEN_2022_PROGRAM_ID
        );

        burnTokenAccount = getAssociatedTokenAddressSync(
            mint,
            burnAuthority,
            true,
            TOKEN_2022_PROGRAM_ID
        );

        // Ops Token Account (must be owned by OPS_WALLET)
        opsTokenAccount = getAssociatedTokenAddressSync(
            mint,
            OPS_WALLET,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        // Create Ops ATA manually (since we don't control the wallet, we pay for it)
        try {
            await createAssociatedTokenAccount(
                provider.connection,
                (provider.wallet as any).payer,
                mint,
                OPS_WALLET,
                undefined,
                TOKEN_2022_PROGRAM_ID
            );
        } catch (e) {
            // Might already exist if we re-use mints, but we make new mints per test
            // verify existence
        }
    });

    describe("initialize", () => {
        it("should create fee vault and burn accounts", async () => {
            await program.methods
                .initialize()
                .accounts({
                    mint: mint,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                })
                .rpc();

            // Verify
            const vaultAccount = await getAccount(provider.connection, feeVaultTokenAccount, undefined, TOKEN_2022_PROGRAM_ID);
            expect(vaultAccount.address.toString()).to.equal(feeVaultTokenAccount.toString());

            const burnAccount = await getAccount(provider.connection, burnTokenAccount, undefined, TOKEN_2022_PROGRAM_ID);
            expect(burnAccount.address.toString()).to.equal(burnTokenAccount.toString());
            expect(parseInt(burnAccount.amount.toString())).to.equal(0);
        });
    });

    describe("sweep_fees", () => {
        beforeEach(async () => {
            // Ensure initialized
            await program.methods
                .initialize()
                .accounts({
                    mint: mint,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                })
                .rpc();
        });

        it("should distribute fees 50/50 to burn and ops", async () => {
            const amount = 2_000_000; // 0.002 tokens

            // Mint directly to fee vault (simulating collected fees)
            await mintTo(
                provider.connection,
                (provider.wallet as any).payer,
                mint,
                feeVaultTokenAccount,
                feeVaultAuthority, // Wait, we can't mint to it if we don't own it? 
                // Ah, mint authority is provider.wallet.publicKey
                amount,
                [],
                undefined,
                TOKEN_2022_PROGRAM_ID
            );

            await program.methods
                .sweepFees()
                .accounts({
                    mint: mint,
                    opsTokenAccount: opsTokenAccount,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                })
                .rpc();

            // Verify splits
            const burnAccount = await getAccount(provider.connection, burnTokenAccount, undefined, TOKEN_2022_PROGRAM_ID);
            const opsAccount = await getAccount(provider.connection, opsTokenAccount, undefined, TOKEN_2022_PROGRAM_ID);

            expect(parseInt(burnAccount.amount.toString())).to.equal(1_000_000);
            expect(parseInt(opsAccount.amount.toString())).to.equal(1_000_000);
        });

        it("should fail if vault is empty", async () => {
            try {
                await program.methods
                    .sweepFees()
                    .accounts({
                        mint: mint,
                        opsTokenAccount: opsTokenAccount,
                        tokenProgram: TOKEN_2022_PROGRAM_ID,
                    })
                    .rpc();
                expect.fail("Should have failed");
            } catch (e: any) {
                expect(e.error.errorCode.code).to.equal("ZeroAmount");
            }
        });

        it("should fail with invalid ops account", async () => {
            // Create a fake ops account
            const fakeOpsKey = anchor.web3.Keypair.generate().publicKey;
            const fakeOpsATA = await createAssociatedTokenAccount(
                provider.connection,
                (provider.wallet as any).payer,
                mint,
                fakeOpsKey,
                undefined,
                TOKEN_2022_PROGRAM_ID
            );

            // Fund vault to pass checks
            await mintTo(
                provider.connection,
                (provider.wallet as any).payer,
                mint,
                feeVaultTokenAccount,
                feeVaultAuthority,
                2_000_000,
                [],
                undefined,
                TOKEN_2022_PROGRAM_ID
            );

            try {
                await program.methods
                    .sweepFees()
                    .accounts({
                        mint: mint,
                        opsTokenAccount: fakeOpsATA, // Wrong account
                        tokenProgram: TOKEN_2022_PROGRAM_ID,
                    })
                    .rpc();
                expect.fail("Should have failed");
            } catch (e: any) {
                // Expect constraint error ("InvalidOpsAccount" or anchor constraint)
                expect(e.error.errorCode.code).to.equal("InvalidOpsAccount");
            }
        });
    });

    describe("edge cases", () => {
        beforeEach(async () => {
            await program.methods
                .initialize()
                .accounts({ mint: mint, tokenProgram: TOKEN_2022_PROGRAM_ID })
                .rpc();
        });

        it("should handle odd amounts (rounding)", async () => {
            const amount = 2_000_001;

            await mintTo(
                provider.connection,
                (provider.wallet as any).payer,
                mint,
                feeVaultTokenAccount,
                provider.wallet.publicKey,
                amount,
                [],
                undefined,
                TOKEN_2022_PROGRAM_ID
            );

            await program.methods
                .sweepFees()
                .accounts({ mint: mint, opsTokenAccount: opsTokenAccount, tokenProgram: TOKEN_2022_PROGRAM_ID })
                .rpc();

            const burnAccount = await getAccount(provider.connection, burnTokenAccount, undefined, TOKEN_2022_PROGRAM_ID);
            const opsAccount = await getAccount(provider.connection, opsTokenAccount, undefined, TOKEN_2022_PROGRAM_ID);

            // burn = floor(2000001 * 0.5) = 1000000
            // ops = 2000001 - 1000000 = 1000001
            expect(parseInt(burnAccount.amount.toString())).to.equal(1_000_000);
            expect(parseInt(opsAccount.amount.toString())).to.equal(1_000_001);
        });
    });
});
