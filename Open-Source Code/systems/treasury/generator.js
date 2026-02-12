const { HDNodeWallet } = require('ethers');
const fs = require('fs');
const path = require('path');

class KeyGenerator {
    constructor(seedPhrase = null) {
        const { Mnemonic } = require('ethers');
        if (seedPhrase) {
            this.mnemonic = Mnemonic.fromPhrase(seedPhrase);
        } else {
            const entropy = require('crypto').randomBytes(32);
            this.mnemonic = Mnemonic.fromEntropy(entropy);
        }
    }

    /**
     * Generate a batch of stealth addresses
     * @param {number} count Number of addresses to generate
     * @param {string} baseDerivationPath BIP44 path (default Ethereum: m/44'/60'/0'/0)
     * @returns {Array} Array of wallet objects (address and privateKey)
     */
    generateBatch(count, baseDerivationPath = "m/44'/60'/0'/0") {
        const wallets = [];
        
        for (let i = 0; i < count; i++) {
            const childPath = `${baseDerivationPath}/${i}`;
            const wallet = HDNodeWallet.fromPhrase(this.mnemonic.phrase, "", childPath);
            wallets.push({
                index: i,
                path: childPath,
                address: wallet.address,
                privateKey: wallet.privateKey
            });
        }
        return wallets;
    }

    getMnemonic() {
        return this.mnemonic.phrase;
    }
}

module.exports = KeyGenerator;
