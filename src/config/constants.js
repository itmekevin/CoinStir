// config/constants.js

// Contract addresses
export const ADDRESSES = {
  ENCLAVE: "0xc0d72DD01AC4a5f8335DB2b302cbCbA4fA10683b",
  HOST: "0x4d48c82CA673ae0816881113EF90ba46ccfD62cc",
  RELAYER: "0x1e0b0E48fF3d725db680157b487E65B690d94503"
};

// Network configuration
export const NETWORK = {
  CHAIN_ID: '0x5aff',
  CHAIN_ID_DECIMAL: 23295,
  NAME: 'Sapphire_Testnet',
  RPC_URL: 'https://testnet.sapphire.oasis.dev',
  BSC_RPC_URL: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
};

// Application settings
export const APP_CONFIG = {
  PAGE_SIZE: 5,
  GAS_PRICE: ".00003",
  FEE_RATE: 10,
  FEE_RATE_STRING: "10"
};

// EIP-712 Domain
export const EIP712_DOMAIN = {
  name: "CoinStir",
  version: "1",
  chainId: NETWORK.CHAIN_ID_DECIMAL,
  verifyingContract: ADDRESSES.ENCLAVE
};

// Messages
export const MESSAGES = {
  LOGIN: "This signature is used to prove ownership of this account, similar to using a password for a username in a more traditional login.",
  SUCCESS: "Congratulations! The Transfer was successful. Please allow 5 to 10 minutes for the funds to be sent to the destination.",
  INSUFFICIENT_FUNDS: "The Transfer failed due to insufficient funds. Check your account balance is greater than the amount being transferred PLUS the 1% service fee and the .0003 ETH gas fee. (value + (value*.01) + .0003)",
  TRANSFER_FAILED: "Hmm.. The Transfer failed. Check your account balance is greater than the amount being transferred PLUS the 1% service fee and the .0003 ETH gas fee. (value + (value*.01) + .0003)"
};

// API Configuration
export const API = {
  ETH_PRICE_KEY: '6KY97RTE8KDTF1RDB4JEP75YQ6XCPBIUHI',
  WITHDRAW_ENDPOINT: 'https://rvbfj38mdh.execute-api.us-east-2.amazonaws.com/CoinStirTest'
};

// UI Colors
export const COLORS = {
  HOVER: '#EDC6FF',
  DEFAULT: '#C6FCED',
  OUTGOING: '#FCBF9D'
};