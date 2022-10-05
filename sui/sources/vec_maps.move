/// Utility functions for VecMap
module gotbeef::vec_maps
{
    use sui::vec_map::{Self, VecMap};

    /// Count how many times a value appears in a VecMap
    public fun count_value<K: copy, V>(
        haystack: &VecMap<K, V>,
        needle: &V): u64
    {
        let count = 0;
        let length = vec_map::size(haystack);
        let i = 0;
        while (i < length) {
            let (_, value) = vec_map::get_entry_by_idx(haystack, i);
            if ( value == needle ) {
                count = count + 1;
            };
            i = i + 1;
        };
        return count
    }

}

#[test_only]
module gotbeef::vec_maps_tests
{
    use sui::vec_map::{Self, VecMap};
    use gotbeef::vec_maps;

    #[test]
    fun test_count_value()
    {
        let map: VecMap<u64, address> = vec_map::empty();
        vec_map::insert(&mut map, 11, @0xA1);
        vec_map::insert(&mut map, 22, @0xA2);
        vec_map::insert(&mut map, 33, @0xA2);
        vec_map::insert(&mut map, 44, @0xA3);

        assert!( vec_maps::count_value(&map, &@0xA2) == 2, 0 );
        assert!( vec_maps::count_value(&map, &@0xA3) == 1, 0 );
        assert!( vec_maps::count_value(&map, &@0xA4) == 0, 0 );
    }

}
