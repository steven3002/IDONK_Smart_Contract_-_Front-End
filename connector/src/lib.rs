#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
// written by Steven Hert, omo this code needs to be formated after the competition

extern crate alloc;
use stylus_sdk::{ prelude::* };
use stylus_sdk::{ msg, alloy_primitives::{ Address } };

use stylus_sdk::call::Call;

// this contract is used to get info, so only view state;

sol_storage! {
    #[entrypoint]
    pub struct Test{
        address content_contract;
        address vote_contract;
        address user_profile_address;
        address community_address;
    } 
}

sol_interface! {

    
    interface IContentState {
        function submitContent(address author, string calldata sub_data, string calldata content_data, uint8 community_id, uint8 content_id) external;

        function getContent(uint8 content_id) external view returns (string memory);

        function getContentByCommunity(uint8 community_id) external view returns (string[] memory);

        function verifyContent(uint8 content_id) external;
    }

    
    
    interface IVotesState {
        function setProfileAddress(address _address) external;
    
        function setRewardAddress(address _address) external;
    
        function voteContent(uint8 content_id, int8 vote, address voter, uint256 stake) external;
    
        function getVoters(uint8 content_id) external view returns (string[] memory);
    
        function getTotalVotes(uint8 content_id) external view returns (string memory);
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


    
    interface ICommunityState {
        function createCommunity(string calldata name, string calldata meta_data) external;
    
            function getCommunity(uint8 index) external view returns (string memory);
    
            function addUserToCommunity(uint8 community_id) external;
    
            function isAMember(uint8 index, address user) external view returns (bool);
    
            function nameTaken(string calldata name) external view returns (bool);
    
        function getLastIndex() external view returns (uint8);
        }
        

        
        
        
}

#[public]
impl Test {
    pub fn set_content_address(&mut self, address: Address) {
        self.content_contract.set(address);
    }

    pub fn set_vote_address(&mut self, address: Address) {
        self.vote_contract.set(address);
    }

    pub fn set_profile_address(&mut self, address: Address) {
        self.user_profile_address.set(address);
    }
    pub fn set_community_address(&mut self, address: Address) {
        self.community_address.set(address);
    }

    pub fn get_content(&self, content_id: u8) -> String {
        let address = self.content_contract.get();
        let meta_date_contract = IContentState::new(address);
        let config = Call::new();
        meta_date_contract.get_content(config, content_id).expect("drat")
    }

    pub fn get_content_list(&self, community_id: u8) -> Vec<String> {
        if community_id > 0 {
            if !self.is_a_member(community_id) {
                return Vec::new();
            }
        }
        let address = self.content_contract.get();
        let meta_date_contract = IContentState::new(address);
        let config = Call::new();
        meta_date_contract.get_content_by_community(config, community_id).expect("drat")
    }

    pub fn has_registered(&self) -> bool {
        let user = msg::sender();
        let address = self.user_profile_address.get();
        let meta_date_contract = IUsers::new(address);
        let config = Call::new();
        meta_date_contract.has_registered(config, user).expect("drat")
    }

    pub fn get_profile(&self) -> String {
        let user = msg::sender();
        let address = self.user_profile_address.get();
        let meta_date_contract = IUsers::new(address);
        let config = Call::new();
        meta_date_contract.get_profile(config, user).expect("drat")
    }

    pub fn get_my_stakes(&self) -> Vec<u8> {
        let user = msg::sender();
        let address = self.user_profile_address.get();
        let meta_date_contract = IUsers::new(address);
        let config = Call::new();
        meta_date_contract.get_my_stakes(config, user).expect("drat")
    }

    pub fn get_voters(&self, content_id: u8) -> Vec<String> {
        let address = self.vote_contract.get();
        let meta_date_contract = IVotesState::new(address);
        let config = Call::new();
        meta_date_contract.get_voters(config, content_id).expect("drat")
    }

    pub fn get_total_votes(&self, content_id: u8) -> String {
        let address = self.vote_contract.get();
        let meta_date_contract = IVotesState::new(address);
        let config = Call::new();
        meta_date_contract.get_total_votes(config, content_id).expect("drat")
    }
}

impl Test {
    pub fn is_a_member(&self, community_id: u8) -> bool {
        let user = msg::sender();
        let address = self.community_address.get();
        let meta_date_contract = ICommunityState::new(address);
        let config = Call::new();
        meta_date_contract.is_a_member(config, community_id, user).expect("drat")
    }
}
