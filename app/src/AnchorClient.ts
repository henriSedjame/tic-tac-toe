import anchor from '@project-serum/anchor'
import {IDL, TicTacToe} from './../../target/types/tic_tac_toe'

import {isPhantomConnected} from "./helpers/utils";
import {WalletPhantomAdaptor} from "./helpers/wallet-phantom-adaptor";

const { SystemProgram } = anchor.web3

export type SetUpRequest = {
    player_two: anchor.web3.PublicKey
}

export type AnchorClientOptions = {
    connectionUrl: string,
    programId: anchor.web3.PublicKey | string,
    walletKeypair?: anchor.web3.Keypair
}

export default class AnchorClient {

    private readonly _programId: anchor.web3.PublicKey | string;
    private readonly _connection: anchor.web3.Connection;
    private readonly _provider: anchor.Provider;
    private _program : anchor.Program<TicTacToe>;

    constructor(options: AnchorClientOptions) {

        this._programId = options.programId;

        this._connection =  new anchor.web3.Connection(options.connectionUrl, "confirmed");

        this._provider = new anchor.Provider(this._connection, AnchorClient.getWallet(options.walletKeypair), {preflightCommitment: "processed"});

        this._program = new anchor.Program<TicTacToe>(IDL, this._programId, this._provider);
    }

    private static getWallet(keypair: anchor.web3.Keypair | undefined) {
        return isPhantomConnected()
            ? new WalletPhantomAdaptor()
            : new anchor.Wallet(keypair ?? anchor.web3.Keypair.generate());
    }

     async getGame(gameKeypair: anchor.web3.Keypair) {
         return await this._program.account.game.fetch(new anchor.web3.PublicKey(gameKeypair.publicKey))
    }

    async setupGame(request: SetUpRequest): Promise<anchor.web3.Keypair> {

        const game = anchor.web3.Keypair.generate();

        await this._program.methods
            .setupGame(request.player_two)
            .accounts({
                game: game.publicKey,
                playerOne: this._provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId
            })
            .signers([game])
            .rpc();

        return game
    }


}