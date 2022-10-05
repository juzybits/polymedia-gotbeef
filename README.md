# Got Beef?

A [Sui](https://sui.io/) package to create on-chain bets. It comes with a built-in escrow and voting functionality.

- Anybody can create a new bet between 2 or more players (up to 256).
- The winner is selected by a single judge, or by a quorum of judges (up to 32).
- Funds can only be transferred to the winner, or refunded back to the players.

Tired of [escrowing millions](https://twitter.com/GiganticRebirth/status/1503335929976664065) for your Twitter friends? Try _Got Beef?_.

## Roadmap
```
git grep -iE '(todo|maybe)' -- ':!README.md'

sui/sources/bet.move:    const E_ALREADY_VOTED: u64 = 202; // (maybe: allow judges to update their vote)
sui/sources/bet.move:        // start_epoch: Option<u64>, // (maybe) voting starts on this day
sui/sources/bet.move:        // end_epoch: Option<u64>, // (maybe) voting ends on this day
sui/sources/bet.move:        // funds: vector<Item>, // (maybe) prize can be any asset(s)
sui/sources/bet.move:    /// - (maybe) If all players agree on cancelling the bet.
sui/sources/bet.move:    /// - (maybe) If a quorum of judges agree on cancelling the bet.
sui/sources/bet.move:    /// - (maybe) If end_epoch is reached without a quorum, any judge or player can cancel the bet.
web/src/js/App.tsx:                {/* TODO: History page */}
web/src/js/App.tsx:        {/* TODO: add version */}
```
