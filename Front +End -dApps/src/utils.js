import { convertFromRaw } from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import BigDecimal from 'js-big-decimal';
import { BAD_INDEX, REWARDS_THRESHOLD } from "./config";
import profile_avatar from './images/avatar.png';

export const ProfileAvatar = () => {
    return (<img src={profile_avatar} alt="avatar" />);
};

export const scrolledToBottom = (e, scrollFn) => {
    const { scrollTop, scrollHeight, offsetHeight } = e.target;
    if(scrollTop >= scrollHeight - offsetHeight - 1) scrollFn();
};

export const setMessageFn = (setter, obj) => {
    setter(obj);
    setTimeout(() => {
        setter({});
    }, 4000);
};

export const amountShort = (amt) => {
    amt -= 0;
    if(amt >= 1E9) return (amt / 1E9).toFixed(2) + 'B';
    else if(amt >= 1E6) return (amt / 1E6).toFixed(2) + 'M';
    else if(amt >= 1E3) return (amt / 1E3).toFixed(2) + 'K';
    else return amt;
};

export const shortenWalletAddress = (address) => {
    if(!address) return 'Wallet';
    return address.slice(0, 6) + '...' + address.slice(-5);
};

export const getDate = (date, ethereum_type = false) => {
    if(ethereum_type) date = (date + '000') - 0;
    date = new Date(date);
    return String(date).slice(0, 15);
};

export const inProductionContent = (val) => {
    const IN_PRODUCTION = false;
    if(!IN_PRODUCTION && val.split(',')[0].split(':')[1] < BAD_INDEX) return false;
    else return true;
};

const days = [ 31,
    ((new Date()).getFullYear() - 2024) % 4 === 0 ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31
];

export const getCommtyDate = (diff_secs, date, today) => {

    const ms = 1000;
    if(diff_secs < 60 * ms) {
        // secs diff is less than or 60 => not up to a min (60 secs)
        const diff = (today.getSeconds() - date.getSeconds() + 60) % 60;
        return diff > 1 ? diff + ' secs ago' : 'a sec ago';
    } else if(diff_secs < 60 * 60 * ms) {
        // secs diff is less than or 60 * 60 => not up to a an hour (60 mins * 60 secs)
        const diff = (today.getMinutes() - date.getMinutes() + 60) % 60;
        return diff > 1 ? diff + ' mins ago' : 'a min ago';
    } else if(diff_secs < 24 * 60 * 60 * ms) {
        const diff = (today.getHours() - date.getHours() + 24) % 24;
        return diff > 1 ? diff + ' hours ago' : 'an hour ago';
    } else if(today.getMonth() === date.getMonth()) {
        // uncomment
        const month_days = days[date.getMonth()];
        const diff = (today.getDate() - date.getDate() + month_days) % month_days;
        return diff > 1 ? diff + ' days ago' : 'a day ago';
    } else if(today.getFullYear() === date.getFullYear()) {
        // uncomment
        const diff = (today.getMonth() - date.getMonth() + 12) % 12;
        return diff > 1 ? diff + ' months ago' : 'a month ago';
    } else {
        return String(date).slice(4, 15);
    }
};

export const formatDate = (date, ethereum_type = false, commty = false) => {
    if(ethereum_type) date = (date + '000') - 0;
    date = new Date(date);
    const today = new Date();
    const diff_secs = today.getTime() - date.getTime();
    const ms = 1000;

    if(commty) return getCommtyDate(diff_secs, date, today);

    if(diff_secs < 60 * ms) {
        // secs diff is less than or 60 => not up to a min (60 secs)
        const diff = (today.getSeconds() - date.getSeconds() + 60) % 60;
        return diff > 1 ? diff + ' secs ago' : 'a sec ago';
    } else if(diff_secs < 60 * 60 * ms) {
        // secs diff is less than or 60 * 60 => not up to a an hour (60 mins * 60 secs)
        const diff = (today.getMinutes() - date.getMinutes() + 60) % 60;
        return diff > 1 ? diff + ' mins ago' : 'a min ago';
    } else if(diff_secs < 24 * 60 * 60 * ms) {
        if(today.getDate() !== date.getDate()) return `Yesterday at ${String(date).slice(16, 21)}`;
        else return `Today at ${String(date).slice(16, 21)}`; 
    } else if(today.getMonth() === date.getMonth()) {
        return `${String(date).slice(0, 3)} at ${String(date).slice(16, 21)}`;
    } else if(today.getFullYear() === date.getFullYear()) {
        return `${String(date).slice(4, 10)} at ${String(date).slice(16, 21)}`;
    } else return `${String(date).slice(4, 15)} at ${String(date).slice(16, 21)}`;
};

export const generateHTMLString = (rawContent) => {
    const contentState = convertFromRaw(rawContent);
    const htmlString = stateToHTML(contentState);
    return htmlString;
};

export const formatFileSize = (size) => {
    const mb = 1024 * 1024;
    if(size >= mb) {
        return `${(size / mb).toFixed(2)}MB`;
    } else if(size > 1024) {
        return `${(size / 1024).toFixed(2)}KB`;
    } else {
        return size + 'B';
    }
};

export const decodeUint8 = (data) => {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(data);
};

export const encodeToByte = (data) => {
    const encoder = new TextEncoder();
    return encoder.encode(data);
};

export const JSONParser = (data) => {
    data = data.split(':');
    let res = '';
    for(let i=0;i<data.length;i++) {
        if(i) res += ':';
        res += data[i].trim();
    }
    return res;
};

export const decodeData = (data, type='JSONstring') => {
    if(type === 'bytes') {
        const decoder = new TextDecoder('utf-8');
        data = new Uint8Array(data);
        data = decoder.decode(data);
    }
    return JSON.parse(data);
};

export const parseSubData = (data, targ) => {
    const res = {};
    const spls = data.slice(1, -1).split('%x2');
    for(let spl of spls) {
        const [key, value] = spl.split('=');
        if(!key) continue;
        if(key === targ) {
            res[key] = value.slice(1, -1).split(',').map(x => x.replaceAll('%x3', '\n'));
        } else res[key] = (value||'').replaceAll('%x3', '\n');
    }
    return res;
};

export const parseContentData = (data) => {
    data = data.replaceAll('\n', '\%x3');
    data = JSON.parse(data);
    const { sub_data } = data;
    const newSubData = parseSubData(sub_data, 'tags');
    return { ...data, sub_data: newSubData };
};

export const parseCommunityData = (data) => {
    data = data.replaceAll('\n', '\%x3');
    data = JSON.parse(data);
    const { meta_data } = data;
    const newMetaData = parseSubData(meta_data, 'topics');
    return { ...data, meta_data: newMetaData };
};

export const delay = async (ms=3000) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};

export const getTokenAmount = (value, decimals=10000000000n) => {
    const n1 = new BigDecimal(value+'');
    const n2 = new BigDecimal(decimals+'');
    const result = BigDecimal.stripTrailingZero((n1.divide(n2)).getValue());
    return String(result);
};

export const multiplyBigDecimals = (value, mul=10000000000n) => {
    const n1 = new BigDecimal(value+'');
    const n2 = new BigDecimal(mul+'');
    const result = BigDecimal.stripTrailingZero((n1.multiply(n2)).getValue());
    return Number(result);
};

export const addBigDecimals = (value, amt) => {
    const n1 = new BigDecimal(value+'');
    const n2 = new BigDecimal(amt+'');
    const result = (n1.add(n2)).getValue();
    return result;
};

export const subtractBigDecimals = (value, amt) => {
    const n1 = new BigDecimal(value+'');
    const n2 = new BigDecimal(amt+'');
    const result = (n1.subtract(n2)).getValue();
    return result;
};

export const rewardableThreshold = (userVote, totalVotes) => {
    userVote -= 0;
    totalVotes -= 0;
    if(userVote === 1 && totalVotes >= REWARDS_THRESHOLD) return true;
    else if(userVote === -1 && totalVotes < REWARDS_THRESHOLD) return true;
    return false;
};
        
// console.log(decodeData([
//     123, 34, 101, 109, 97, 105, 108, 34, 58, 34, 111, 
//     115, 97, 116, 111, 57, 48, 48, 64, 103, 109, 97, 
//     105, 108, 46, 99, 111, 109, 34, 44, 34, 97, 98, 
//     111, 117, 116, 34, 58, 34, 86, 101, 114, 121, 32, 
//     100, 101, 109, 117, 114, 101, 32, 66, 108, 111, 99, 
//     107, 32, 67, 104, 97, 105, 110, 32, 101, 110, 116, 
//     104, 117, 115, 105, 97, 115, 116, 46, 34, 44, 34, 105, 
//     110, 116, 101, 114, 101, 115, 116, 115, 34, 58, 91, 93, 
//     125], 'bytes'));