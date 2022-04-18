//@ts-nocheck

import anchor, {Wallet} from '@project-serum/anchor'


export class WalletPhantomAdaptor implements Wallet {

    get publicKey(): anchor.web3.PublicKey {
        return window.solana.publicKey;
    }

    signAllTransactions(txs: anchor.web3.Transaction[]): Promise<anchor.web3.Transaction[]> {
        return await window.solana.signAllTransactions(txs);
    }

    async signTransaction(tx: anchor.web3.Transaction) : Promise<anchor.web3.Transaction> {
        return await window.solana.signTransaction(tx);
    }
}