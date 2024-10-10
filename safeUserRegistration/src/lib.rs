#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
// written by Steven Hert, omo this code needs to be formated after the competition, rushing to meet up with time

extern crate alloc;
use stylus_sdk::{ prelude::*, stylus_proc::entrypoint };
use stylus_sdk::{ console, msg, alloy_primitives::{ Address, U8, U256 }, contract };

use stylus_sdk::call::Call;

// #[global_allocator]
// static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

sol_storage! {
 #[entrypoint]
 pub struct Test{
    uint8 content_index;
    address content_contract;
    address vote_contract;
    address communities;
    address erc20;
    address this_contract_address;
    address user_profile_address;
    // address reward;
 } 
}

sol_interface! {
    
    
    interface IUsers {
        function setErc2OAddress(address _address) external;
    
        function registerUser(address _address) external;
    
        function hasRegistered(address user_address) external view returns (bool);
    
        function changeReputationState(address user_id, int64 points) external;
    
        function getProfile(address user_id) external view returns (string memory);
    
        function setMyStakes(address user, uint8 content_id) external;
    
        function setCommunity(address user, uint8 community_id) external;
    
        function getMyStakes(address user) external view returns (uint8[] memory);
    }

}

#[public]
impl Test {
    pub fn set_profile_address(&mut self, address: Address) {
        self.user_profile_address.set(address);
    }

    pub fn register_user(&mut self) {
        let user_x = msg::sender();
        let meta_date_contract = IUsers::new(*self.user_profile_address);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .register_user(config, user_x)
            .expect("Failed to call on MetaDate_contract");
    }
}
