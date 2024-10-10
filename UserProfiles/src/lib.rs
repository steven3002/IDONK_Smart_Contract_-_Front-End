#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

use alloy_primitives::{ Address, U32, I8, U8, U256 };
use stylus_sdk::{ prelude::*, block, contract };
use stylus_sdk::call::Call;

sol_storage! {
    #[entrypoint]
    pub struct Users {
        mapping(address => User) users;
        address erc20;
    }


    pub struct User{
        address user_id;
        bool has_registered;
        Profile profile;
    }

    pub struct Controlx{
        uint8 indy;
    }

    pub struct Profile{
        // string bio;
        int8 reputation;
        uint32 joined_at;
        Controlx[] user_community;
        Controlx[] author_content;
    }

}

sol_interface! {
    interface IErc20 {
        function name() external pure returns (string memory);

        function symbol() external pure returns (string memory);

        function decimals() external pure returns (uint8);

        function totalSupply() external view returns (uint256);

        function balanceOf(address owner) external view returns (uint256);

        function transfer(address to, uint256 value) external returns (bool);

        function transferFrom(address from, address to, uint256 value) external returns (bool);

        function stakeControl(address from, uint256 value) external returns (bool);

        function approve(address spender, uint256 value) external returns (bool);

        function allowance(address owner, address spender) external view returns (uint256);

        function setAdmin(address admin) external;

        function setTransactionLimit(uint256 limit) external;

        function pause() external;

        function unpause() external;

        function isPaused() external view returns (bool);

        function mint(uint256 value) external;

        function mintTo(address to, uint256 value) external;
    
    }
}

#[public]
impl Users {
    pub fn set_erc2o_address(&mut self, address: Address) {
        self.erc20.set(address);
    }

    pub fn register_user(&mut self, address: Address) {
        if self.has_registered(address) {
            return;
        }
        let mut new_user = self.users.setter(address);
        let current_time = U32::from(block::timestamp());

        new_user.user_id.set(address);
        new_user.profile.reputation.set(I8::unchecked_from(0));
        new_user.profile.joined_at.set(current_time);
        new_user.has_registered.set(true);

        self.set_self_admin();
        let token = U256::from(20_000_000);
        self.mint_tkn(token, address);
    }

    pub fn has_registered(&self, user_address: Address) -> bool {
        self.users.get(user_address).has_registered.get()
    }

    pub fn change_reputation_state(&mut self, user_id: Address, points: i64) {
        let mut user = self.users.setter(user_id);

        let current_point = user.profile.reputation.get();
        let new_point = current_point + I8::unchecked_from(points);
        user.profile.reputation.set(new_point);
    }

    pub fn get_profile(&self, user_id: Address) -> String {
        let user = self.users.get(user_id);

        let formatted_string = format!(
            r#"{{"user_id":"{}","reputation":{},"joined_at":"{}"}}"#,
            user.user_id.get(),
            user.profile.reputation.get(),
            user.profile.joined_at.get()
        );

        formatted_string
    }

    pub fn set_my_stakes(&mut self, user: Address, content_id: u8) {
        let mut user_profile = self.users.setter(user);
        let mut stakes = user_profile.profile.author_content.grow();
        stakes.indy.set(U8::from(content_id));
    }

    pub fn set_community(&mut self, user: Address, community_id: u8) {
        let mut user_profile = self.users.setter(user);
        let mut communities = user_profile.profile.user_community.grow();
        communities.indy.set(U8::from(community_id));
    }

    pub fn get_my_stakes(&self, user: Address) -> Vec<u8> {
        let user_profile = self.users.get(user);
        let mut list: Vec<u8> = vec![];
        for inx in 0..user_profile.profile.author_content.len() {
            let test = user_profile.profile.author_content.get(inx).unwrap();
            let tests = test.indy.get().to::<u8>();
            list.push(tests);
        }
        return list;
    }
}

impl Users {
    pub fn mint_tkn(&mut self, tkn: U256, address: Address) {
        let meta_date_contract = IErc20::new(*self.erc20);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .mint_to(config, address, tkn)
            .expect("Failed to call on MetaDate_contract");
    }

    pub fn set_self_admin(&mut self) {
        let self_address = contract::address();
        let meta_date_contract = IErc20::new(*self.erc20);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .set_admin(config, self_address)
            .expect("Failed to call on MetaDate_contract");
    }
}
