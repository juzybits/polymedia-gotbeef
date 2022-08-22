/// Functions to send funds to addresses
module beef::transfers
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
            // Pending: use remove_entry_by_idx() when available
            let (key_ref, _) = vec_map::get_entry_by_idx(funds, i);
            let (_, coin) = vec_map::remove(funds, &*key_ref);
            balance::join( &mut total_balance, coin::into_balance(coin) );
        };
        // Send all funds
        transfer::transfer(
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
            // Pending: use remove_entry_by_idx() when available
            let (addr_ref, _) = vec_map::get_entry_by_idx(funds, i);
            let (addr, coin) = vec_map::remove(funds, &*addr_ref);
            transfer::transfer(coin, addr);
        }
    }
}

#[test_only]
module beef::transfers_tests
{
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::test_scenario as ts;
    use sui::vec_map::{Self, VecMap};
    use beef::transfers;

    const AMOUNT: u64 = 100;
    const ADDR_1: address = @0xA1;
    const ADDR_2: address = @0xA2;
    const ADDR_3: address = @0xA3;
    const SOMEONE: address = @0xC0B1E;

    #[test]
    fun test_send_all()
    {
        let scen = &mut ts::begin(&SOMEONE);
        {
            let funds: VecMap<address, Coin<SUI>> = vec_map::empty();

            let ctx = ts::ctx(scen);
            vec_map::insert(&mut funds, ADDR_1, coin::mint_for_testing<SUI>(AMOUNT, ctx));
            vec_map::insert(&mut funds, ADDR_2, coin::mint_for_testing<SUI>(AMOUNT, ctx));
            vec_map::insert(&mut funds, ADDR_3, coin::mint_for_testing<SUI>(AMOUNT, ctx));

            transfers::send_all(&mut funds, ADDR_3, ctx);

            vec_map::destroy_empty(funds);
        };
        ts::next_tx(scen, &ADDR_3); {
            let coin = ts::take_owned<Coin<SUI>>(scen);
            assert!( coin::value(&coin) == AMOUNT * 3 , 0 );
            ts::return_owned(scen, coin);
        };
    }

    #[test]
    fun test_refund_all()
    {
        let scen = &mut ts::begin(&SOMEONE);
        {
            let funds: VecMap<address, Coin<SUI>> = vec_map::empty();

            let ctx = ts::ctx(scen);
            vec_map::insert(&mut funds, ADDR_1, coin::mint_for_testing<SUI>(AMOUNT, ctx));
            vec_map::insert(&mut funds, ADDR_2, coin::mint_for_testing<SUI>(AMOUNT, ctx));
            vec_map::insert(&mut funds, ADDR_3, coin::mint_for_testing<SUI>(AMOUNT, ctx));

            transfers::refund_all(&mut funds);

            vec_map::destroy_empty(funds);
        };
        ts::next_tx(scen, &ADDR_1); {
            let coin = ts::take_owned<Coin<SUI>>(scen);
            assert!( coin::value(&coin) == AMOUNT , 0 );
            ts::return_owned(scen, coin);
        };
        ts::next_tx(scen, &ADDR_2); {
            let coin = ts::take_owned<Coin<SUI>>(scen);
            assert!( coin::value(&coin) == AMOUNT , 0 );
            ts::return_owned(scen, coin);
        };
        ts::next_tx(scen, &ADDR_3); {
            let coin = ts::take_owned<Coin<SUI>>(scen);
            assert!( coin::value(&coin) == AMOUNT , 0 );
            ts::return_owned(scen, coin);
        };
    }
}
