import * as anchor from "@project-serum/anchor";
import {Program} from "@project-serum/anchor";
import {TicTacToe} from "../target/types/tic_tac_toe";
import {expect} from "chai";


describe("tic-tac-toe", () => {

    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.Provider.env());

    const program = anchor.workspace.TicTacToe as Program<TicTacToe>;

    async function setupGame() {
        let gameKeypair = anchor.web3.Keypair.generate();
        let playerOne = program.provider.wallet;
        let playerTwo = anchor.web3.Keypair.generate();

        await program.methods.setupGame(playerTwo.publicKey)
            .accounts({
                game: gameKeypair.publicKey,
                playerOne: playerOne.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId
            })
            .signers([gameKeypair])
            .rpc()

        let gameState = await program.account.game.fetch(gameKeypair.publicKey);
        return {playerOne, playerTwo, gameKeypair, gameState};
    }

    async function play(program, game, player,
                        tile, expectedTurn, expectedGameState, expectedBoard) {
        await program.rpc.play(tile, {
            accounts: {
                player: player.publicKey,
                game
            },
            signers: player instanceof (anchor.Wallet as any) ? [] : [player]
        });

        const gameState = await program.account.game.fetch(game);
        expect(gameState.turn).to.equal(expectedTurn);
        expect(gameState.state).to.eql(expectedGameState);
        expect(gameState.board)
            .to
            .eql(expectedBoard);

    }

    it("setup game!", async () => {

        let {playerOne, playerTwo, gameKeypair, gameState} = await setupGame();

        expect(gameState.turn).to.equal(1);

        expect(gameState.players)
            .to
            .eql([playerOne.publicKey, playerTwo.publicKey]);

        expect(gameState.state).to.eql({ active: {} });

        expect(gameState.board)
            .to
            .eql([[null,null,null],[null,null,null],[null,null,null]]);

    });

    it('player one wins', async() => {

        let {playerOne, playerTwo, gameKeypair, gameState} = await setupGame();

        expect(gameState.turn).to.equal(1);

        expect(gameState.players)
            .to
            .eql([playerOne.publicKey, playerTwo.publicKey]);

        expect(gameState.state).to.eql({ active: {} });

        expect(gameState.board)
            .to
            .eql([[null,null,null],[null,null,null],[null,null,null]]);

        await play(
            program,
            gameKeypair.publicKey,
            playerOne,
            {row: 0, column: 0},
            2,
            { active: {}, },
            [
                [{x:{}},null,null],
                [null,null,null],
                [null,null,null]
            ]
        );
    });

});
