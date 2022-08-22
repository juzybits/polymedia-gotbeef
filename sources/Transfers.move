/// Utility functions for vectors
module beef::transfers
{
    use sui::balance;
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::vec_map::{Self, VecMap};

    /// Send all funds to the winner
    public fun pay_winner<T>( // TODO: unit tests
        funds: &mut VecMap<address, Coin<T>>,
        winner_addr: address,
        ctx: &mut TxContext)
    {
        let total_balance = balance::zero();
        let i = vec_map::size(funds);
        while (i > 0) {
            i = i - 1;
            // Find player address
            let (player_addr, _) = vec_map::get_entry_by_idx(funds, i);
            // Grab player funds
            let (_, player_coin) = vec_map::remove(funds, &*player_addr);
            // Accumulate balance
            balance::join(
                &mut total_balance,
                coin::into_balance(player_coin)
            );
        };
        // Send all funds to the winner
        transfer::transfer(
            coin::from_balance(total_balance, ctx),
            winner_addr
        );
    }

    /// Send all funds back to the players
    public fun refund_all<T>(funds: &mut VecMap<address, Coin<T>>) // TODO: unit tests
    {
        let i = vec_map::size(funds);
        while (i > 0) {
            i = i - 1;
            // Find player address
            let (player_addr_ref, _) = vec_map::get_entry_by_idx(funds, i);
            // Grab player funds
            let (player_addr, player_coin) = vec_map::remove(funds, &*player_addr_ref);
            // Return funds
            transfer::transfer(player_coin, player_addr);
        }
    }
}
