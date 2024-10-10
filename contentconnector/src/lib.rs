#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
// written by Steven Hert, omo this code needs to be formated after the competition, rushing to meet up with time

extern crate alloc;
use stylus_sdk::{ prelude::*, stylus_proc::entrypoint };
use stylus_sdk::{ console, msg, alloy_primitives::{ Address, U8 } };

use stylus_sdk::call::Call;

sol_storage! {
 #[entrypoint]
 pub struct Test{
    uint8 content_index;
    address content_contract;
    address user_profile_address;
    mapping(address => Data) draft; // due to the issue of the RPC error form meta mask,
    // i am going to be using this to get the index of a created draft 
    // address reward;
 } 
 pub struct Data{
    uint8 draft_data;
 }
}

sol_interface! {
    
    interface IContentState {
        function submitContent(address author, string calldata sub_data, string calldata content_data, uint8 community_id, uint8 content_id) external;

        function getContent(uint8 content_id) external view returns (string memory);

        function getContentByCommunity(uint8 community_id) external view returns (string[] memory);

        function verifyContent(uint8 content_id) external;
    }

    
        
    
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
    pub fn set_content_address(&mut self, address: Address) {
        self.content_index.set(U8::from(3));
        self.content_contract.set(address);
    }

    pub fn set_profile_address(&mut self, address: Address) {
        self.user_profile_address.set(address);
    }

    pub fn add_content(&mut self, sub_data: String, content_data: String, community_id: u8) {
        let sender = msg::sender();
        let conte = self.content_index.get();
        let content_id: u8 = conte.to::<u8>();

        self.change_reputation_state(7);

        let mut draft_instance = self.draft.setter(msg::sender());
        draft_instance.draft_data.set(conte);

        let meta_date_contract = IContentState::new(*self.content_contract);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .submit_content(config, sender, sub_data, content_data, community_id, content_id)
            .expect("Failed to call on MetaDate_contract");

        let new_content_id = self.content_index.get() + U8::from(1);
        self.content_index.set(new_content_id);
    }

    pub fn get_draft(&self) -> u8 {
        let sender = msg::sender();
        let draft = self.draft.get(sender).draft_data.get();
        let result: u8 = draft.to::<u8>();
        result
    }
}

impl Test {
    pub fn change_reputation_state(&mut self, points: i64) {
        let ct_rw = msg::sender();
        let meta_date_contract = IUsers::new(*self.user_profile_address);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .change_reputation_state(config, ct_rw, points)
            .expect("Failed to call on MetaDate_contract");
    }
}
