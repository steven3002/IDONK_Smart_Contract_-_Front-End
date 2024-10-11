import { Contract, ethers } from "ethers";
import userMetadata from '../contractAbi/userMetaData/contractAbi.json';
import safeUserRegistration from '../contractAbi/safeUserRegistration/contractAbi.json';
import userProfiles from '../contractAbi/UserProfiles/contractAbi.json';
import rewards from '../contractAbi/reward/contractAbi.json';
import communities from '../contractAbi/communities/contratAbi.json';
import erc20 from '../contractAbi/erc20/contractAbi.json';

import content from '../contractAbi/connector/contractAbi.json';
import contentCreator from '../contractAbi/contentconnector/contractAbi.json';

import votes from '../contractAbi/voteconnector/contractAbi.json';
import voters from '../contractAbi/voters/contarctAbi.json';
// ignore content work abi

// export const USER_METADATA_ADDRESS = "0xd427860021b153fbe4ba34272be3c4597ed0898c";
// export const SAFE_USER_REGISTRATION_ADDRESS = "0xf34f1dd15273f31faaae8e54385178ff3b43cae1";
// export const USER_PROFILES_ADDRESS = "0x3cedbe0702cad8913542a38060dedb97462df3ec";
// export const REWARDS_ADDRESS = "0x7aae818cd315ac78ec61ad904f07745648c86381";
// export const COMMUNITIES_ADDRESS = "0xfa0d22b46dcc14f3dafde41bcb14344192463e2e";
// export const CONTENT_CREATOR_ADDRESS = "0x94f4ce2c5ad6d01138859bebcf9e4bb6c2cb5ad0";
// export const CONTENT_ADDRESS = "0x1a7bb16a82bf54c360f27f68aae92bccf941e9b1";
// export const VOTES_ADDRESS = "0x35eaaa42db35f8be39470e76b4495d4bdb890930";
// export const VOTERS_ADDRESS = "0x7be071b751735cef17c6559a8b8192d6d0800bd9";
// export const ERC20_ADDRESS = "0xf43980d57ae6d79d56f069cdaa351395610381ba";

export const USER_METADATA_ADDRESS = "0xefe079f1975463dd9f453f81591303df35e963ca";
export const SAFE_USER_REGISTRATION_ADDRESS = "0x7c90e34a2b70df6d7141062c2234fe936227a112";
export const USER_PROFILES_ADDRESS = "0x963926627f623e767a2f91c12d94e8130bba5ca6";
export const REWARDS_ADDRESS = "0xb1d55e116abcbbcca0344f5dcff9d3160e0da574";
export const CONTENT_CREATOR_ADDRESS = "0x4adb1baadd00b2e530985be175fdad6389f16880";
export const CONTENT_ADDRESS = "0xe85054de8b9412606aa15f67febfd655cdb2a44c";
export const COMMUNITIES_ADDRESS = "0xadfac23f0e34ad46e0cf691bb2c6823f14771161";
export const VOTES_ADDRESS = "0xf22a802dae9498512373e89c50387790961ef8bb";
export const VOTERS_ADDRESS = "0x085e9075267d0b4883206e8ac5451bd836fa795e";
export const ERC20_ADDRESS = "0xf43980d57ae6d79d56f069cdaa351395610381ba";

export const parseBigInt = (uint8) => {
    return ethers.getBigInt(uint8, "myBigInt");
};

export const createUserContractInstance = async (signer) => {
    return await new Contract(USER_METADATA_ADDRESS, userMetadata, signer);
};

export const createUserProfilesContractInstance = async (signer) => {
    return await new Contract(USER_PROFILES_ADDRESS, userProfiles, signer);
};

export const createERC20ContractInstance = async (signer) => {
    return await new Contract(ERC20_ADDRESS, erc20, signer);
};

export const createVotesContractInstance = async (signer) => {
    return await new Contract(VOTES_ADDRESS, votes, signer);
};

export const createVotersContractInstance = async (signer) => {
    return await new Contract(VOTERS_ADDRESS, voters, signer);
};

export const createContentCreatorContractInstance = async (signer) => {
    return await new Contract(CONTENT_CREATOR_ADDRESS, contentCreator, signer);
};

export const createContentContractInstance = async (signer) => {
    return await new Contract(CONTENT_ADDRESS, content, signer);
};

export const createRewardsContractInstance = async (signer) => {
    return await new Contract(REWARDS_ADDRESS, rewards, signer);
};

export const createCommunitiesContractInstance = async (signer) => {
    return await new Contract(COMMUNITIES_ADDRESS, communities, signer);
};

export const createSafeUserRegistrationContractInstance = async (signer) => {
    return await new Contract(SAFE_USER_REGISTRATION_ADDRESS, safeUserRegistration, signer);
};