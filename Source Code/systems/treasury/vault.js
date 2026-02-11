const KeyGenerator = require('./generator');
const Distributor = require('./distributor');
const Consolidator = require('./consolidator');
const fs = require('fs');
const crypto = require('crypto');

class StrategicReserveVault {
    constructor(config = {}) {
        this.generator = new KeyGenerator(config.seedPhrase);
        this.distributor = new Distributor(config.provider);
        this.consolidator = new Consolidator(config.provider);
        this.wallets = [];
        this.vaultPath = config.vaultPath || './vault.json';
        this.password = process.env.VAULT_PASSWORD || config.password;
    }

    /**
     * Initialize the reserve with a set of stealth wallets
     */
    init(walletCount = 10) {
        this.wallets = this.generator.generateBatch(walletCount);
        this.saveVault();
        return this.wallets.map(w => w.address);
    }

    /**
     * Distribute capital into the stealth network
     */
    async fundReserve(sourceWallet, totalAmount) {
        const targetAddresses = this.wallets.map(w => w.address);
        const amountPerWallet = totalAmount / targetAddresses.length;

        await this.distributor.scatter(sourceWallet, targetAddresses, {
            totalAmount,
            minAmountPerWallet: amountPerWallet * 0.9,
            maxAmountPerWallet: amountPerWallet * 1.1,
            randomizeOrder: true
        });
    }

    /**
     * Consolidate the strategic reserve to a destination
     */
    async liquidizeReserve(destinationAddress) {
        // Load wallets with private keys
        await this.consolidator.gather(this.wallets, destinationAddress);
    }

    _encrypt(text) {
        if (!this.password) throw new Error("VAULT_PASSWORD required for encryption");
        const iv = crypto.randomBytes(16);
        const key = crypto.scryptSync(this.password, 'salt', 32);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    _decrypt(text) {
        if (!this.password) throw new Error("VAULT_PASSWORD required for decryption");
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const key = crypto.scryptSync(this.password, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

    saveVault() {
        if (!this.password) {
            console.error("❌ SECURITY ERROR: Cannot save vault without VAULT_PASSWORD environment variable.");
            throw new Error("Vault save aborted: Missing Password");
        }

        const data = {
            mnemonic: this.generator.getMnemonic(),
            wallets: this.wallets.map(w => ({
                address: w.address,
                path: w.path,
                index: w.index
            }))
        };

        const payload = JSON.stringify(data);
        const encrypted = this._encrypt(payload);

        fs.writeFileSync(this.vaultPath, JSON.stringify({
            version: 2,
            encrypted: true,
            payload: encrypted
        }, null, 2));

        console.log(`🔒 Vault metadata saved (ENCRYPTED) to ${this.vaultPath}`);
    }

    loadVault() {
        if (fs.existsSync(this.vaultPath)) {
            const raw = JSON.parse(fs.readFileSync(this.vaultPath));

            let data;
            if (raw.encrypted) {
                if (!this.password) throw new Error("Vault is encrypted. Set VAULT_PASSWORD.");
                const decryptedStr = this._decrypt(raw.payload);
                data = JSON.parse(decryptedStr);
            } else {
                console.warn("⚠️ WARNING: Loading UNENCRYPTED vault. Please save immediately to encrypt.");
                data = raw;
            }

            this.generator = new KeyGenerator(data.mnemonic);
            this.wallets = this.generator.generateBatch(data.wallets.length);
            console.log(`Vault loaded with ${this.wallets.length} wallets.`);
        }
    }
}

module.exports = StrategicReserveVault;
