pub mod state;
pub mod instructions;

use anchor_lang::prelude::*;
use crate::instructions::*;
use crate::state::*;

declare_id!("9RVaNNtCJcKaJn414qawi9RGVgnbR6goHt27BvAaRVtx");

#[program]
pub mod tic_tac_toe {
    use super::*;

    pub fn setup_game(ctx: Context<SetupGame>, player_two: Pubkey) -> Result<()> {
        ctx.accounts.game.start([ctx.accounts.player_one.key(), player_two])
    }

    pub fn play(ctx: Context<Play>, tile: Tile) -> Result<()> {
        let  game = &mut  ctx.accounts.game;

        require_keys_eq!(
            game.current_player(),
            ctx.accounts.player.key(),
            TicTacToeError::NotPlayersTurn
        );

        game.play(&tile)
    }
}


