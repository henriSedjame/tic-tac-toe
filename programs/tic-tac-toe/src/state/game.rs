use anchor_lang::prelude::*;
use num_derive::*;
use num_traits::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Eq, PartialEq)]
pub enum GameState {
    Active,
    Tie,
    Won {winner : Pubkey }
}

#[derive(AnchorSerialize, AnchorDeserialize, FromPrimitive, ToPrimitive, Copy, Clone, Eq, PartialEq)]
pub enum Sign {
    X,
    O
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct Tile {
    row: u8,
    column: u8
}

#[error_code]
pub enum TicTacToeError {
    TileOutOfBounds,
    TileAlreadySet,
    GameAlreadyOver,
    NotPlayersTurn,
    GameAlreadyStarted
}

#[account]
pub struct Game {
    players: [Pubkey; 2],             // 32 * 2
    turn: u8,                         // 1
    board: [[Option<Sign>; 3]; 3],    // 9 * (1+1)
    state: GameState                  // 32 + 1
}

impl Game {

    pub const MAXIMUM_SIZE: usize = (32 * 2) + 1 + (9 * (1 +1 )) + (32 +1);

    pub fn start(&mut self, players: [Pubkey; 2]) -> Result<()> {
        require_eq!(self.turn, 0, TicTacToeError::GameAlreadyStarted);
        self.players = players;
        self.turn = 1;
        Ok(())
    }

    pub fn is_active(&self) -> bool {
        self.state == GameState::Active
    }

    fn current_player_index(&self) -> usize {
        ((self.turn - 1) % 2) as usize
    }

    pub fn current_player(&self) -> Pubkey {
        self.players[self.current_player_index()]
    }

    fn is_winning_trio(&self, trio: [(usize, usize); 3]) -> bool {
        let [first, second, third] = trio;
        self.board[first.0][first.1].is_some()
            && self.board[first.0][first.1] == self.board[second.0][second.1]
            && self.board[first.0][first.1] == self.board[third.0][third.1]
    }

    fn update_state(&mut self) {

        for i in 0..=2 {

            if self.is_winning_trio([(i,0), (i,1), (i,3)]) {
                self.state = GameState::Won {
                    winner: self.current_player()
                };
                return;
            }

            if self.is_winning_trio([(0,i), (1,i), (3,i)]) {
                self.state = GameState::Won {
                    winner: self.current_player()
                };
                return;
            }

            if self.is_winning_trio([(0, 0), (1, 1), (2, 2)])
                || self.is_winning_trio([(0, 2), (1, 1), (2, 0)])
            {
                self.state = GameState::Won {
                    winner: self.current_player(),
                };
                return;
            }

            // reaching this code means the game has not been won,
            // so if there are unfilled tiles left, it's still active
            for row in 0..=2 {
                for column in 0..=2 {
                    if self.board[row][column].is_none() {
                        return;
                    }
                }
            }

            // game has not been won
            // game has no more free tiles
            // -> game ends in a tie
            self.state = GameState::Tie;

        }

    }

    pub fn play(&mut self, tile: &Tile) -> Result<()> {

        require!(self.is_active(), TicTacToeError::GameAlreadyOver);

        match tile {
            tile @ Tile {
                row: 0 ..=2,
                column: 0..=2
            } => {
                match self.board[tile.row as usize][tile.column as usize] {
                    None => {
                        self.board[tile.row as usize][tile.column as usize] = Some(Sign::from_usize(self.current_player_index()).unwrap())
                    }
                    Some(_) => return Err(TicTacToeError::TileAlreadySet.into())
                }
            }
            _ => return Err(TicTacToeError::TileOutOfBounds.into())
        }

        self.update_state();

        if GameState::Active == self.state {
            self.turn += 1;
        }

        Ok(())
    }

}