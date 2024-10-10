// Imported packages
use alloc::string::String;
use alloy_primitives::{ Address, U256 };
use alloy_sol_types::sol;
use core::marker::PhantomData;
use stylus_sdk::{ evm, msg, prelude::*, block };

const MIN_BALANCE: u8 = 50;
const MIN_TRANSACTION_DELAY: u64 = 15; // 15 seconds between transactions
const MAX_SUPPLY: u128 = 760_000_000_000_000_000;

pub trait Erc20Params {
    /// Immutable token name
    const NAME: &'static str;

    /// Immutable token symbol
    const SYMBOL: &'static str;

    /// Immutable token decimals
    const DECIMALS: u8;
}

sol_storage! {
    /// Erc20 implements all ERC-20 methods.
    pub struct Erc20<T> {
        address admin;
        /// Maps users to balances
        mapping(address => uint256) balances;
        /// Maps users to a mapping of each spender's allowance
        mapping(address => mapping(address => uint256)) allowances;
        /// The total supply of the token
        uint256 total_supply; //going to be at 76mil tokens therefor 76*(10^16) = 76, 000, 000 . 00 0000 0000
        /// Used to allow [`Erc20Params`]
        PhantomData<T> phantom;

        // time user lasst made a transaction 
        mapping(address => uint256) last_transaction_time;

        // set transaction limit
        // to start i want to make sure a user can not transact more than 0.1 percent of the total supply
        uint256 transaction_limit;

        


        // this is what i want to uses as a maintance countrol. it is not perfect for now.
        // it is just for the hack. i will update it after the hack with more time in hand 

        bool pause;

    }
}

// Declare events and Solidity error types
sol! {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error InsufficientBalance(address from, uint256 have, uint256 want);
    error InsufficientAllowance(address owner, address spender, uint256 have, uint256 want);

    // my error
    error RestrictedCall(address caller);
    error CoolDownRestriction(address caller, uint256 last_time);
    error MaxTranscationReached(uint256 transaction_limit, uint256 value);
    error SystemPause(bool is_system_paused, uint256 time_stamp);
    error MaxSupplyExceed(uint256 max_supply);
    error InvalidParameter(address from, address to);
}

/// Represents the ways methods may fail.
#[derive(SolidityError)]
pub enum Erc20Error {
    InsufficientBalance(InsufficientBalance),
    InsufficientAllowance(InsufficientAllowance),
    RestrictedCall(RestrictedCall),
    CoolDownRestriction(CoolDownRestriction),
    MaxTranscationReached(MaxTranscationReached),
    SystemPause(SystemPause),
    MaxSupplyExceed(MaxSupplyExceed),
    InvalidParameter(InvalidParameter),
}

// These methods aren't exposed to other contracts
// Methods marked as "pub" here are usable outside of the erc20 module (i.e. they're callable from lib.rs)
// Note: modifying storage will become much prettier soon
impl<T: Erc20Params> Erc20<T> {
    /// Movement of funds between 2 accounts
    /// (invoked by the external transfer() and transfer_from() functions )
    pub fn _transfer(&mut self, from: Address, to: Address, value: U256) -> Result<(), Erc20Error> {
        // this is the minimun ballace of a user has to have after transfer for a transfer to be valid
        // this will make sure that you cannot call to yourself
        if from == to {
            return Err(
                Erc20Error::InvalidParameter(InvalidParameter {
                    from,
                    to,
                })
            );
        }

        let transaction_limit = self.transaction_limit.get();

        // this is too get the user balance
        let mut sender_balance = self.balances.setter(from);
        let old_sender_balance = sender_balance.get();

        if self.pause.get() {
            return Err(
                Erc20Error::SystemPause(SystemPause {
                    is_system_paused: true,
                    time_stamp: U256::from(block::timestamp()),
                })
            );
        }

        // checking if the token that the user want to transact is more than the traction limit
        if transaction_limit < value {
            return Err(
                Erc20Error::MaxTranscationReached(MaxTranscationReached {
                    transaction_limit,
                    value,
                })
            );
        }
        //checking balance after transfer
        let remaining_balance = old_sender_balance - value;

        // checking if the user has enough balance
        if old_sender_balance < value || remaining_balance < U256::from(MIN_BALANCE) {
            return Err(
                Erc20Error::InsufficientBalance(InsufficientBalance {
                    from,
                    have: old_sender_balance,
                    want: value,
                })
            );
        }

        // this is too checck if the cooldown is over
        // first to check if it is the admin, so that the stake can be rewarded
        let mut last_time = self.last_transaction_time.setter(from);
        if msg::sender() != self.admin.get() {
            if U256::from(block::timestamp()) < last_time.get() + U256::from(MIN_TRANSACTION_DELAY) {
                return Err(
                    Erc20Error::CoolDownRestriction(CoolDownRestriction {
                        caller: from,
                        last_time: last_time.get(),
                    })
                );
            }
        }
        // tthis is the part where the actual trascation is being countroled.
        sender_balance.set(old_sender_balance - value);

        // Increasing receiver balance
        let mut to_balance = self.balances.setter(to);
        let new_to_balance = to_balance.get() + value;
        to_balance.set(new_to_balance);
        // this is to set a new time for the user to transact
        last_time.set(U256::from(block::timestamp()));

        // Emitting the transfer event
        evm::log(Transfer { from, to, value });
        Ok(())
    }

    /// Mints `value` tokens to `address`
    pub fn mint(&mut self, address: Address, value: U256) -> Result<(), Erc20Error> {
        if msg::sender() != self.admin.get() {
            return Err(
                Erc20Error::RestrictedCall(RestrictedCall {
                    caller: msg::sender(),
                })
            );
        }

        // this is to make sure that the max supply is not excceded
        let supply_test = self.total_supply.get() + value;

        if supply_test >= U256::from(MAX_SUPPLY) {
            return Err(
                Erc20Error::MaxSupplyExceed(MaxSupplyExceed {
                    max_supply: U256::from(MAX_SUPPLY),
                })
            );
        }

        // Increasing balance
        let mut balance = self.balances.setter(address);
        let new_balance = balance.get() + value;
        balance.set(new_balance);

        // Increasing total supply
        self.total_supply.set(self.total_supply.get() + value);

        // Emitting the transfer event
        evm::log(Transfer {
            from: Address::ZERO,
            to: address,
            value,
        });

        Ok(())
    }

    /// Burns `value` tokens from `address`
    pub fn burn(&mut self, address: Address, value: U256) -> Result<(), Erc20Error> {
        if msg::sender() != self.admin.get() {
            return Err(
                Erc20Error::RestrictedCall(RestrictedCall {
                    caller: msg::sender(),
                })
            );
        }
        // Decreasing balance
        let mut balance = self.balances.setter(address);
        let old_balance = balance.get();
        if old_balance < value {
            return Err(
                Erc20Error::InsufficientBalance(InsufficientBalance {
                    from: address,
                    have: old_balance,
                    want: value,
                })
            );
        }
        balance.set(old_balance - value);

        // Decreasing the total supply
        self.total_supply.set(self.total_supply.get() - value);

        // Emitting the transfer event
        evm::log(Transfer {
            from: address,
            to: Address::ZERO,
            value,
        });

        Ok(())
    }

    // pub fn is_paused(&self)->bool{
    //     self.paused.get()
    // }
}

// These methods are external to other contracts
// Note: modifying storage will become much prettier soon
#[public]
impl<T: Erc20Params> Erc20<T> {
    /// Immutable token name
    pub fn name() -> String {
        T::NAME.into()
    }

    /// Immutable token symbol
    pub fn symbol() -> String {
        T::SYMBOL.into()
    }

    /// Immutable token decimals
    pub fn decimals() -> u8 {
        T::DECIMALS
    }

    /// Total supply of tokens
    pub fn total_supply(&self) -> U256 {
        self.total_supply.get()
    }

    /// Balance of `address`
    pub fn balance_of(&self, owner: Address) -> U256 {
        self.balances.get(owner)
    }

    /// Transfers `value` tokens from msg::sender() to `to`
    pub fn transfer(&mut self, to: Address, value: U256) -> Result<bool, Erc20Error> {
        self._transfer(msg::sender(), to, value)?;
        Ok(true)
    }

    /// Transfers `value` tokens from `from` to `to`
    /// (msg::sender() must be able to spend at least `value` tokens from `from`)
    pub fn transfer_from(
        &mut self,
        from: Address,
        to: Address,
        value: U256
    ) -> Result<bool, Erc20Error> {
        // Check msg::sender() allowance
        let mut sender_allowances = self.allowances.setter(from);
        let mut allowance = sender_allowances.setter(msg::sender());
        let old_allowance = allowance.get();
        if old_allowance < value {
            return Err(
                Erc20Error::InsufficientAllowance(InsufficientAllowance {
                    owner: from,
                    spender: msg::sender(),
                    have: old_allowance,
                    want: value,
                })
            );
        }

        // Decreases allowance
        allowance.set(old_allowance - value);

        // Calls the internal transfer function
        self._transfer(from, to, value)?;

        Ok(true)
    }

    pub fn stake_control(&mut self, from: Address, value: U256) -> Result<bool, Erc20Error> {
        if msg::sender() != self.admin.get() {
            return Err(
                Erc20Error::RestrictedCall(RestrictedCall {
                    caller: msg::sender(),
                })
            );
        }
        let admin_wallet = self.admin.get();
        self._transfer(from, admin_wallet, value)?;
        Ok(true)
    }

    /// Approves the spenditure of `value` tokens of msg::sender() to `spender`
    pub fn approve(&mut self, spender: Address, value: U256) -> bool {
        self.allowances.setter(msg::sender()).insert(spender, value);
        evm::log(Approval {
            owner: msg::sender(),
            spender,
            value,
        });
        true
    }

    /// Returns the allowance of `spender` on `owner`'s tokens
    pub fn allowance(&self, owner: Address, spender: Address) -> U256 {
        self.allowances.getter(owner).get(spender)
    }

    pub fn set_admin(&mut self, admin: Address) {
        // this will also hold as contract ownership and gaurdiance admin
        self.admin.set(admin);
    }

    pub fn set_transaction_limit(&mut self, limit: U256) -> Result<(), Erc20Error> {
        if msg::sender() != self.admin.get() {
            return Err(
                Erc20Error::RestrictedCall(RestrictedCall {
                    caller: msg::sender(),
                })
            );
        }
        self.transaction_limit.set(limit);
        return Ok(());
    }
    pub fn pause(&mut self) -> Result<(), Erc20Error> {
        if msg::sender() != self.admin.get() {
            return Err(
                Erc20Error::RestrictedCall(RestrictedCall {
                    caller: msg::sender(),
                })
            );
        }
        self.pause.set(true);
        return Ok(());
    }

    pub fn unpause(&mut self) -> Result<(), Erc20Error> {
        if msg::sender() != self.admin.get() {
            return Err(
                Erc20Error::RestrictedCall(RestrictedCall {
                    caller: msg::sender(),
                })
            );
        }
        self.pause.set(false);
        return Ok(());
    }
    pub fn is_paused(&self) -> bool {
        self.pause.get()
    }
}
