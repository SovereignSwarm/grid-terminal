import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GridTransferHook } from "../target/types/grid_transfer_hook";
import {
  TOKEN_2022_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
  transferChecked,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("grid-transfer-hook", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GridTransferHook as Program<GridTransferHook>;
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  // Test accounts
  let mint: PublicKey;
  let sourceTokenAccount: PublicKey;
  let destinationTokenAccount: PublicKey;
  let opsTokenAccount: PublicKey;
  let burnTokenAccount: PublicKey;
  let extraAccountMetaListPDA: PublicKey;

  const mintAuthority = Keypair.generate();
  const source = Keypair.generate();
  const destination = Keypair.generate();
  const opsWallet = Keypair.generate();

  before(async () => {
    // Airdrop SOL to test accounts
    await connection.requestAirdrop(source.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await connection.requestAirdrop(destination.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await connection.requestAirdrop(opsWallet.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    
    // Wait for airdrops
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  it("Creates mint with transfer hook extension", async () => {
    // Create mint with transfer hook
    mint = await createMint(
      connection,
      wallet.payer,
      mintAuthority.publicKey,
      null,
      9, // decimals
      Keypair.generate(),
      { commitment: "confirmed" },
      TOKEN_2022_PROGRAM_ID
    );

    console.log("Mint created:", mint.toString());
  });

  it("Initializes ExtraAccountMetaList", async () => {
    // Derive PDA
    [extraAccountMetaListPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("extra-account-metas"), mint.toBuffer()],
      program.programId
    );

    // Initialize
    await program.methods
      .initializeExtraAccountMetaList()
      .accounts({
        payer: wallet.publicKey,
        extraAccountMetaList: extraAccountMetaListPDA,
        mint: mint,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("ExtraAccountMetaList initialized");
  });

  it("Creates token accounts", async () => {
    // Create source account
    sourceTokenAccount = await createAccount(
      connection,
      wallet.payer,
      mint,
      source.publicKey,
      Keypair.generate(),
      { commitment: "confirmed" },
      TOKEN_2022_PROGRAM_ID
    );

    // Create destination account
    destinationTokenAccount = await createAccount(
      connection,
      wallet.payer,
      mint,
      destination.publicKey,
      Keypair.generate(),
      { commitment: "confirmed" },
      TOKEN_2022_PROGRAM_ID
    );

    // Create ops account
    opsTokenAccount = await createAccount(
      connection,
      wallet.payer,
      mint,
      opsWallet.publicKey,
      Keypair.generate(),
      { commitment: "confirmed" },
      TOKEN_2022_PROGRAM_ID
    );

    // Create burn account
    const burnAddress = new PublicKey("11111111111111111111111111111111");
    burnTokenAccount = await createAccount(
      connection,
      wallet.payer,
      mint,
      burnAddress,
      Keypair.generate(),
      { commitment: "confirmed" },
      TOKEN_2022_PROGRAM_ID
    );

    // Mint tokens to source
    await mintTo(
      connection,
      wallet.payer,
      mint,
      sourceTokenAccount,
      mintAuthority,
      1_000_000_000_000, // 1,000 tokens (with 9 decimals)
      [],
      { commitment: "confirmed" },
      TOKEN_2022_PROGRAM_ID
    );

    console.log("Token accounts created and funded");
  });

  it("Transfers tokens with 2% tax", async () => {
    const transferAmount = 1_000_000_000; // 1 token

    // Get initial balances
    const sourceAccountBefore = await getAccount(
      connection,
      sourceTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    const opsAccountBefore = await getAccount(
      connection,
      opsTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    const burnAccountBefore = await getAccount(
      connection,
      burnTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    console.log("Source balance before:", sourceAccountBefore.amount.toString());
    console.log("Ops balance before:", opsAccountBefore.amount.toString());
    console.log("Burn balance before:", burnAccountBefore.amount.toString());

    // Transfer with hook
    await transferChecked(
      connection,
      wallet.payer,
      sourceTokenAccount,
      mint,
      destinationTokenAccount,
      source,
      transferAmount,
      9,
      [],
      { commitment: "confirmed" },
      TOKEN_2022_PROGRAM_ID
    );

    // Get final balances
    const sourceAccountAfter = await getAccount(
      connection,
      sourceTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    const destinationAccountAfter = await getAccount(
      connection,
      destinationTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    const opsAccountAfter = await getAccount(
      connection,
      opsTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    const burnAccountAfter = await getAccount(
      connection,
      burnTokenAccount,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    console.log("Source balance after:", sourceAccountAfter.amount.toString());
    console.log("Destination balance after:", destinationAccountAfter.amount.toString());
    console.log("Ops balance after:", opsAccountAfter.amount.toString());
    console.log("Burn balance after:", burnAccountAfter.amount.toString());

    // Verify tax was deducted (2% = 20,000,000 out of 1,000,000,000)
    const expectedTax = transferAmount * 2 / 100;
    const expectedBurn = expectedTax / 2;
    const expectedOps = expectedTax - expectedBurn;

    expect(opsAccountAfter.amount - opsAccountBefore.amount).to.equal(BigInt(expectedOps));
    expect(burnAccountAfter.amount - burnAccountBefore.amount).to.equal(BigInt(expectedBurn));
  });
});
