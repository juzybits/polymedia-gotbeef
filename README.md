# Beef

Beef is a [Sui](https://sui.io/) package (_a.k.a._ "smart contract") to create on-chain bets. It comes with a built-in escrow and voting functionality.

- Anybody can create a new bet between 2 or more players (up to 256).
- The winner is selected by a single judge, or by a quorum of judges (up to 32).
- Funds can only be transferred to the winner, or refunded back to the players.

Tired of [escrowing millions](https://twitter.com/GiganticRebirth/status/1503335929976664065) for your Twitter friends? Try Beef.

## How to test
```
sui move test --coverage
sui move coverage summary
sui move coverage source --module bet
sui move coverage bytecode --module bet
```
