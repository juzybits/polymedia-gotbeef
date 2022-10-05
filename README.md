# Got Beef?

A [Sui](https://sui.io/) package to create on-chain bets. It comes with a built-in escrow and voting functionality.

- Anybody can create a new bet between 2 or more players (up to 256).
- The winner is selected by a single judge, or by a quorum of judges (up to 32).
- Funds can only be transferred to the winner, or refunded back to the players.

Tired of [escrowing millions](https://twitter.com/GiganticRebirth/status/1503335929976664065) for your Twitter friends? Try _Got Beef?_.

## Dev setup
1. [Install Sui](https://docs.sui.io/build/install#binaries)
2. Connect to devnet: `sui client switch --rpc https://fullnode.devnet.sui.io:443`

## How to run the unit tests
```
sui move test
```
Show test coverage:
```
sui move test --coverage
sui move coverage summary
sui move coverage source --module bet
sui move coverage bytecode --module bet
```

## How to publish the package
```
sui client publish --gas-budget 30000
```

## How to use from `sui console`
#### Fund a bet
```
call --package PACKAGE_ID --module bet --function fund --type-args 0x2::sui::SUI --args BET_ID COIN_ID --gas-budget 1000
```

## Roadmap
```
grep -iE '(todo|maybe)' -- ':!README.md'

sources/bet.move:    const E_ALREADY_VOTED: u64 = 202; // (maybe: allow judges to update their vote)
sources/bet.move:        // start_epoch: Option<u64>, // (maybe) voting starts on this day
sources/bet.move:        // end_epoch: Option<u64>, // (maybe) voting ends on this day
sources/bet.move:        // funds: vector<Item>, // (maybe) prize can be any asset(s)
sources/bet.move:    /// - (maybe) If all players agree on cancelling the bet.
sources/bet.move:    /// - (maybe) If a quorum of judges agree on cancelling the bet.
sources/bet.move:    /// - (maybe) If end_epoch is reached without a quorum, any judge or player can cancel the bet.
webapp/src/js/App.tsx:                {/* TODO: History page */}
webapp/src/js/App.tsx:        {/* TODO: add version */}
```
