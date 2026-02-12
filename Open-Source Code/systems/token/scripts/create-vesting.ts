/**
 * Streamflow Vesting Contract Creator for $GRID
 * 
 * Creates on-chain vesting contracts for Founder and Team allocations
 * 
 * Run: npx ts-node create-vesting.ts
 */

import {
    StreamflowSolana,
    Types,
    getBN
} from "@streamflow/stream";
import {
    Connection,
    Keypair,
    PublicKey,
    clusterApiUrl
} from "@solana/web3.js";
import * as fs from "fs";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // Network
    cluster: "devnet" as const,
    rpcUrl: clusterApiUrl("devnet"),

    // Token (UPDATE AFTER MINT CREATION)
    mintAddress: "YOUR_GRID_MINT_ADDRESS_HERE",
    decimals: 9,

    // Vesting schedules
    founder: {
        wallet: "FOUNDER_WALLET_ADDRESS_HERE",
        amount: 80_530_636, // 7.5% of supply
        cliffMonths: 6,
        vestingMonths: 18, // Linear release after cliff
        name: "GRID Founder Vesting",
    },

    team: {
        wallet: "TEAM_WALLET_ADDRESS_HERE",
        amount: 26_843_546, // 2.5% of supply
        cliffMonths: 6,
        vestingMonths: 18,
        name: "GRID Team Vesting",
    },

    lpLock: {
        wallet: "LP_TOKEN_HOLDER_ADDRESS_HERE",
        lockMonths: 12,
        name: "GRID LP Lock",
    }
};

// ============================================================================
// HELPERS
// ============================================================================

function monthsToSeconds(months: number): number {
    return months * 30 * 24 * 60 * 60;
}

function loadKeypair(path: string): Keypair {
    const secretKey = JSON.parse(fs.readFileSync(path, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

// ============================================================================
// VESTING CONTRACT CREATION
// ============================================================================

async function createVestingContract(
    client: StreamflowSolana.SolanaStreamClient,
    sender: Keypair,
    recipientAddress: string,
    tokenAmount: number,
    cliffMonths: number,
    vestingMonths: number,
    name: string
): Promise<string> {

    const totalDurationSeconds = monthsToSeconds(cliffMonths + vestingMonths);
    const cliffSeconds = monthsToSeconds(cliffMonths);
    const amountWithDecimals = tokenAmount * (10 ** CONFIG.decimals);

    // Monthly release after cliff
    const monthlyAmount = Math.floor(amountWithDecimals / vestingMonths);
    const releaseFrequencySeconds = monthsToSeconds(1); // Monthly

    const createParams: Types.ICreateStreamData = {
        recipient: recipientAddress,
        tokenId: CONFIG.mintAddress,
        start: Math.floor(Date.now() / 1000) + 60, // Start in 1 minute
        amount: getBN(amountWithDecimals, CONFIG.decimals),
        period: releaseFrequencySeconds,
        cliff: cliffSeconds,
        cliffAmount: getBN(0, CONFIG.decimals), // Nothing released at cliff
        amountPerPeriod: getBN(monthlyAmount, CONFIG.decimals),
        name: name,

        // SECURITY: Make immutable
        cancelableBySender: false,
        cancelableByRecipient: false,
        transferableBySender: false,
        transferableByRecipient: false,

        // Auto-claim settings
        canTopup: false,
        automaticWithdrawal: false,
        withdrawalFrequency: releaseFrequencySeconds,
    };

    console.log(`\nCreating vesting contract: ${name}`);
    console.log(`  Recipient: ${recipientAddress}`);
    console.log(`  Amount: ${tokenAmount.toLocaleString()} GRID`);
    console.log(`  Cliff: ${cliffMonths} months`);
    console.log(`  Vesting: ${vestingMonths} months (linear)`);

    try {
        const { ixs, tx, metadata } = await client.create(createParams, {
            sender: sender,
            isNative: false,
        });

        console.log(`  ✅ Contract created: ${metadata?.publicKey?.toString()}`);
        console.log(`  Transaction: ${tx}`);

        return metadata?.publicKey?.toString() || "";
    } catch (error) {
        console.error(`  ❌ Failed to create contract:`, error);
        throw error;
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    console.log("=".repeat(60));
    console.log("$GRID Streamflow Vesting Creator");
    console.log("=".repeat(60));
    console.log(`Network: ${CONFIG.cluster}`);
    console.log(`Mint: ${CONFIG.mintAddress}`);

    // Validate configuration
    if (CONFIG.mintAddress === "YOUR_GRID_MINT_ADDRESS_HERE") {
        console.error("\n❌ ERROR: Update CONFIG.mintAddress with actual mint address");
        process.exit(1);
    }

    // Load deployer keypair
    const deployerKeyPath = process.env.DEPLOYER_KEY || "./deployer-key.json";
    console.log(`\nLoading deployer from: ${deployerKeyPath}`);

    let deployer: Keypair;
    try {
        deployer = loadKeypair(deployerKeyPath);
        console.log(`Deployer: ${deployer.publicKey.toString()}`);
    } catch (e) {
        console.error("❌ Failed to load deployer keypair");
        console.error("Set DEPLOYER_KEY env var or place deployer-key.json in current directory");
        process.exit(1);
    }

    // Initialize Streamflow client
    const connection = new Connection(CONFIG.rpcUrl, "confirmed");
    const client = new StreamflowSolana.SolanaStreamClient(CONFIG.rpcUrl);

    // Check balances
    const balance = await connection.getBalance(deployer.publicKey);
    console.log(`Deployer balance: ${balance / 1e9} SOL`);

    if (balance < 0.1 * 1e9) {
        console.error("❌ Insufficient SOL balance (need at least 0.1 SOL)");
        process.exit(1);
    }

    // Create contracts
    const contracts: Record<string, string> = {};

    // 1. Founder Vesting
    if (CONFIG.founder.wallet !== "FOUNDER_WALLET_ADDRESS_HERE") {
        contracts.founder = await createVestingContract(
            client,
            deployer,
            CONFIG.founder.wallet,
            CONFIG.founder.amount,
            CONFIG.founder.cliffMonths,
            CONFIG.founder.vestingMonths,
            CONFIG.founder.name
        );
    } else {
        console.log("\n⚠️ Skipping Founder vesting (update CONFIG.founder.wallet)");
    }

    // 2. Team Vesting
    if (CONFIG.team.wallet !== "TEAM_WALLET_ADDRESS_HERE") {
        contracts.team = await createVestingContract(
            client,
            deployer,
            CONFIG.team.wallet,
            CONFIG.team.amount,
            CONFIG.team.cliffMonths,
            CONFIG.team.vestingMonths,
            CONFIG.team.name
        );
    } else {
        console.log("\n⚠️ Skipping Team vesting (update CONFIG.team.wallet)");
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("VESTING CONTRACTS SUMMARY");
    console.log("=".repeat(60));

    for (const [name, address] of Object.entries(contracts)) {
        if (address) {
            console.log(`${name}: https://app.streamflow.finance/contract/${address}`);
        }
    }

    console.log("\n✅ Save these addresses for public verification!");
}

main().catch(console.error);
