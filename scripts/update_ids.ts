import * as fs from 'fs';
import * as path from 'path';
import { Keypair } from "@solana/web3.js";

// Paths
const TERMINAL_ROOT = path.join(__dirname, '..');
const CORE_ROOT = path.join(TERMINAL_ROOT, '..', 'grid-core');

const DEPLOY_DIRS = [
    path.join(TERMINAL_ROOT, 'target', 'deploy'),
    path.join(CORE_ROOT, 'systems', 'identity', 'programs', 'target', 'deploy'),
    path.join(CORE_ROOT, 'systems', 'governance', 'programs', 'target', 'deploy'),
    path.join(CORE_ROOT, 'systems', 'token', 'programs', 'target', 'deploy')
];

const KEYPAIRS = {
    identity: 'agent_identity-keypair.json',
    staking: 'vegrid_staking-keypair.json',
    guard: 'policy_guard-keypair.json',
    hook: 'grid_transfer_hook-keypair.json',
    sweep: 'grid_fee_sweep-keypair.json'
};

const ANCHOR_TOML_FILES = [
    path.join(CORE_ROOT, 'systems', 'identity', 'programs', 'Anchor.toml'),
    path.join(CORE_ROOT, 'systems', 'governance', 'programs', 'Anchor.toml'),
    path.join(CORE_ROOT, 'systems', 'token', 'programs', 'Anchor.toml')
];

const HOOK_LIB = path.join(CORE_ROOT, 'systems', 'token', 'programs', 'grid-transfer-hook', 'src', 'lib.rs');
const CHAIN_CONFIG = path.join(TERMINAL_ROOT, '..', 'grid-interface', 'src', 'lib', 'chain-config.js');

function getKeypair(filename: string): Keypair | null {
    for (const dir of DEPLOY_DIRS) {
        const p = path.join(dir, filename);
        if (fs.existsSync(p)) {
            try {
                // console.log(`Found keypair at: ${p}`);
                const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(p, 'utf-8')));
                return Keypair.fromSecretKey(secretKey);
            } catch (e) {
                console.error(`Error reading ${filename} at ${p}:`, e);
            }
        }
    }
    return null;
}

function updateFile(filePath: string, replacements: { pattern: RegExp, value: string }[]) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf-8');
    let updated = false;

    for (const { pattern, value } of replacements) {
        if (pattern.test(content)) {
            const newContent = content.replace(pattern, value);
            if (newContent !== content) {
                content = newContent;
                updated = true;
                // console.log(`  Updated match for ${pattern}`);
            }
        }
    }

    if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated ${path.basename(filePath)}`);
    } else {
        console.log(`- No changes needed in ${path.basename(filePath)}`);
    }
}

async function main() {
    console.log("🔄 AUTO-UPDATE PROGRAM IDs");
    console.log("--------------------------");

    // 1. Load Keys
    const keys = {
        identity: getKeypair(KEYPAIRS.identity),
        staking: getKeypair(KEYPAIRS.staking),
        guard: getKeypair(KEYPAIRS.guard),
        hook: getKeypair(KEYPAIRS.hook),
        sweep: getKeypair(KEYPAIRS.sweep),
    };

    // 2. Prepare Replacements
    const anchorReplacements: any[] = [];
    const hookReplacements: any[] = [];
    const configReplacements: any[] = [];

    if (keys.identity) {
        const pid = keys.identity.publicKey.toBase58();
        console.log(`Passport ID: ${pid}`);
        anchorReplacements.push({ pattern: /agent_identity = "[^"]+"/g, value: `agent_identity = "${pid}"` });
        // Update Hook's reference to Identity (Hardcoded PID check)
        // Look for: declare_id!("...") or constant usage? 
        // Hook uses: use agent_identity::program::AgentIdentity;
        // The ID is usually in usage. 
        // We might need to find where the Identity ID is passed or used.
        // It's mostly via CPI context, but `declare_id` of Identity itself isn't in Hook.
        // Wait, did we hardcode it in lib.rs?
        // Ah, likely in the client or anchor.toml mostly.

        configReplacements.push({ pattern: /agentIdentity: '[^']+'/g, value: `agentIdentity: '${pid}'` });
    }

    if (keys.staking) {
        const pid = keys.staking.publicKey.toBase58();
        console.log(`Staking ID:  ${pid}`);
        anchorReplacements.push({ pattern: /vegrid_staking = "[^"]+"/g, value: `vegrid_staking = "${pid}"` });
        configReplacements.push({ pattern: /veGrid: '[^']+'/g, value: `veGrid: '${pid}'` });
    }

    if (keys.guard) {
        const pid = keys.guard.publicKey.toBase58();
        console.log(`Guard ID:    ${pid}`);
        anchorReplacements.push({ pattern: /policy_guard = "[^"]+"/g, value: `policy_guard = "${pid}"` });
        configReplacements.push({ pattern: /policyGuard: '[^']+'/g, value: `policyGuard: '${pid}'` });

        // Update Hook's reference to Guard (ExtraAccountMeta)
        // This is tricky via regex. We might look for the specific hardcoded Pubkey in `initialize_extra_account_meta_list`.
        // "2u4Lt..."
        hookReplacements.push({ pattern: /pubkey!\("2u4Lt[^"]+"\)/g, value: `pubkey!("${pid}")` });
    }

    if (keys.hook) {
        const pid = keys.hook.publicKey.toBase58();
        console.log(`Hook ID:     ${pid}`);
        anchorReplacements.push({ pattern: /grid_transfer_hook = "[^"]+"/g, value: `grid_transfer_hook = "${pid}"` });
        configReplacements.push({ pattern: /transferHook: '[^']+'/g, value: `transferHook: '${pid}'` });

        // Update Hook's OWN declare_id!
        hookReplacements.push({ pattern: /declare_id!\("[^"]+"\)/g, value: `declare_id!("${pid}")` });
    }

    if (keys.sweep) {
        const pid = keys.sweep.publicKey.toBase58();
        console.log(`Sweep ID:    ${pid}`);
        anchorReplacements.push({ pattern: /grid_fee_sweep = "[^"]+"/g, value: `grid_fee_sweep = "${pid}"` });
        configReplacements.push({ pattern: /feeSweep: '[^']+'/g, value: `feeSweep: '${pid}'` });
    }

    // 3. Apply Updates
    console.log("Updating files...");

    for (const anchorFile of ANCHOR_TOML_FILES) {
        updateFile(anchorFile, anchorReplacements);
    }

    updateFile(HOOK_LIB, hookReplacements);
    updateFile(CHAIN_CONFIG, configReplacements);

    console.log("Done.");
}

main();
