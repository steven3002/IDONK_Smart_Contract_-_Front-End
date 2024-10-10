import axios from 'axios';
import { ERC20_ADDRESS, SERVER_URL, etherscanApiKey } from "../config";

export const getData = (data) => {
    const url = `${SERVER_URL}/get_data`;
    return axios.get(url);
};

export const getTransactionHistoryData = () => {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${ERC20_ADDRESS}&startblock=0&endblock=99999999&sort=asc&apikey=${etherscanApiKey}`;
    return axios.get(url);
};

export const sendFile = (data) => {
    const url = `${SERVER_URL}/upload_contents_file`;
    return axios.post(url, data);
};

export const sendProfileFile = (data) => {
    const url = `${SERVER_URL}/upload_users_file`;
    return axios.post(url, data);
};