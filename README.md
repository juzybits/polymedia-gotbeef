# Got Beef?

A [Sui](https://sui.io/) package to create on-chain bets. It comes with a built-in escrow and voting functionality.

- Anybody can create a new bet between 2 or more players (up to 256).
- The winner is selected by a single judge, or by a quorum of judges (up to 32).
- Funds can only be transferred to the winner, or refunded back to the players.

Tired of [escrowing millions](https://twitter.com/GiganticRebirth/status/1503335929976664065) for your Twitter friends? Try _Got Beef?_.

## Dev setup
1. [Install Sui](https://docs.sui.io/build/install#binaries)
2. Connect to devnet: `sui client switch --rpc https://gateway.devnet.sui.io:443`

## Run the unit tests
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

## Publish the package
```
sui client publish --gas-budget 30000
```

## Use from `sui console`
#### Fund a bet
```
call --package PACKAGE_ID --module bet --function fund --type-args 0x2::sui::SUI --args BET_ID COIN_ID --gas-budget 1000
```
