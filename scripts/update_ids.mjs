import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve paths relative to this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TERMINAL_ROOT = path.resolve(__dirname, '..');
const CORE_ROOT = path.resolve(TERMINAL_ROOT, '..', 'grid-core');
const INTERFACE_ROOT = path.resolve(TERMINAL_ROOT, '..', 'grid-interface');

// Use existing installed dependency from Frontend to avoid install
// This is a "hack" to use the environment's existing tools
const WEB3_PATH = path.join(INTERFACE_ROOT, 'node_modules', '@solana', 'web3.js');

let Keypair;
try {
    // Dynamic import to load the module from the specific path
    // We import the default export or specific export
    const web3 = await import(path.join('file://', WEB3_PATH, 'lib', 'index.esm.js'));
    // Note: web3.js structure varies, but usually lists main file in package.json.
    // Let's try standard import first, if node resolution works. 
    // But since we are outside that package, we might need absolute path import.
    Keypair = web3.Keypair;
} catch (e) {
    console.log("Could not load local web3.js, trying standard import...");
    try {
        const web3 = await import('@solana/web3.js');
        Keypair = web3.Keypair;
    } catch (e2) {
        console.error("❌ Could not find @solana/web3.js. Please run 'npm install' in grid-interface first.");
        process.exit(1);
    }
}

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

function getKeypair(filename) {
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

function updateFile(filePath, replacements) {
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
    console.log("🔄 AUTO-UPDATE PROGRAM IDs (ESM Mode)");
    console.log("-------------------------------------");

    // 1. Load Keys
    const keys = {
        identity: getKeypair(KEYPAIRS.identity),
        staking: getKeypair(KEYPAIRS.staking),
        guard: getKeypair(KEYPAIRS.guard),
        hook: getKeypair(KEYPAIRS.hook),
        sweep: getKeypair(KEYPAIRS.sweep),
    };

    // 2. Prepare Replacements
    const anchorReplacements = [];
    const hookReplacements = [];
    const configReplacements = [];

    if (keys.identity) {
        const pid = keys.identity.publicKey.toBase58();
        console.log(`Passport ID: ${pid}`);
        anchorReplacements.push({ pattern: /agent_identity = "[^"]+"/g, value: `agent_identity = "${pid}"` });
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
        hookReplacements.push({ pattern: /pubkey!\("2u4Lt[^"]+"\)/g, value: `pubkey!("${pid}")` });
    }

    if (keys.hook) {
        const pid = keys.hook.publicKey.toBase58();
        console.log(`Hook ID:     ${pid}`);
        anchorReplacements.push({ pattern: /grid_transfer_hook = "[^"]+"/g, value: `grid_transfer_hook = "${pid}"` });
        configReplacements.push({ pattern: /transferHook: '[^']+'/g, value: `transferHook: '${pid}'` });
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
