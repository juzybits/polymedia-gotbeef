/// Functions to send funds to addresses
module gotbeef::transfers
{
    use sui::balance;
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::tx_context::TxContext;
    use sui::vec_map::{Self, VecMap};

    /// Send all funds to a given address
    public fun send_all<K: copy+drop, T>(
        funds: &mut VecMap<K, Coin<T>>,
        recipient: address,
        ctx: &mut TxContext)
    {
        // Accumulate balance
        let total_balance = balance::zero();
        let i = vec_map::size(funds);
        while (i > 0) {
            i = i - 1;
            let (_, coin) = vec_map::remove_entry_by_idx(funds, i);
            balance::join( &mut total_balance, coin::into_balance(coin) );
        };
        // Send all funds
        transfer::public_transfer(
            coin::from_balance(total_balance, ctx),
            recipient
        );
    }

    /// Send all funds (values) back to the associated addresses (keys)
    public fun refund_all<T>(funds: &mut VecMap<address, Coin<T>>)
    {
        let i = vec_map::size(funds);
        while (i > 0) {
            i = i - 1;
            let (addr, coin) = vec_map::remove_entry_by_idx(funds, i);
            transfer::public_transfer(coin, addr);
        }
    }
}

#[test_only]
module gotbeef::transfers_tests
{
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::test_scenario as ts;
    use sui::vec_map::{Self, VecMap};
    use gotbeef::transfers;

    const AMOUNT: u64 = 100;
    const ADDR_1: address = @0xA1;
    const ADDR_2: address = @0xA2;
    const ADDR_3: address = @0xA3;
    const SOMEONE: address = @0xC0B1E;

    #[test]
    fun test_send_all()
    {
        let scen_val = ts::begin(SOMEONE);
        let scen = &mut scen_val;
        let funds: VecMap<address, Coin<SUI>> = vec_map::empty();

        let ctx = ts::ctx(scen);
        vec_map::insert(&mut funds, ADDR_1, coin::mint_for_testing<SUI>(AMOUNT, ctx));
        vec_map::insert(&mut funds, ADDR_2, coin::mint_for_testing<SUI>(AMOUNT, ctx));
        vec_map::insert(&mut funds, ADDR_3, coin::mint_for_testing<SUI>(AMOUNT, ctx));

        transfers::send_all(&mut funds, ADDR_3, ctx);

        vec_map::destroy_empty(funds);
        ts::next_tx(scen, ADDR_3); {
            let coin = ts::take_from_sender<Coin<SUI>>(scen);
            assert!( coin::value(&coin) == AMOUNT * 3 , 0 );
            ts::return_to_sender(scen, coin);
        };
        ts::end(scen_val);
    }

    #[test]
    fun test_refund_all()
    {
        let scen_val = ts::begin(SOMEONE);
        let scen = &mut scen_val;
        {
            let funds: VecMap<address, Coin<SUI>> = vec_map::empty();

            let ctx = ts::ctx(scen);
            vec_map::insert(&mut funds, ADDR_1, coin::mint_for_testing<SUI>(AMOUNT, ctx));
            vec_map::insert(&mut funds, ADDR_2, coin::mint_for_testing<SUI>(AMOUNT, ctx));
            vec_map::insert(&mut funds, ADDR_3, coin::mint_for_testing<SUI>(AMOUNT, ctx));

            transfers::refund_all(&mut funds);

            vec_map::destroy_empty(funds);
        };
        ts::next_tx(scen, ADDR_1); {
            let coin = ts::take_from_sender<Coin<SUI>>(scen);
            assert!( coin::value(&coin) == AMOUNT , 0 );
            ts::return_to_sender(scen, coin);
        };
        ts::next_tx(scen, ADDR_2); {
            let coin = ts::take_from_sender<Coin<SUI>>(scen);
            assert!( coin::value(&coin) == AMOUNT , 0 );
            ts::return_to_sender(scen, coin);
        };
        ts::next_tx(scen, ADDR_3); {
            let coin = ts::take_from_sender<Coin<SUI>>(scen);
            assert!( coin::value(&coin) == AMOUNT , 0 );
            ts::return_to_sender(scen, coin);
        };
        ts::end(scen_val);
    }
}
