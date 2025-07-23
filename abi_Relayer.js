// abiModule.js

export const relayerABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "len",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "offset",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "need",
          "type": "uint256"
        }
      ],
      "name": "CBOR_Error_BufferOverrun",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "byteLength",
          "type": "uint256"
        }
      ],
      "name": "CBOR_Error_BytesTooLong",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CBOR_InvalidKey",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "CBOR_InvalidLength",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "CBOR_InvalidMap",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "name": "CBOR_InvalidUintPrefix",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "name": "CBOR_InvalidUintSize",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint64",
          "name": "",
          "type": "uint64"
        }
      ],
      "name": "CoreCallDataPublicKeyError",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "DER_Split_Error",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "SubcallError",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "reason",
          "type": "string"
        }
      ],
      "name": "TransactionWillFail",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "UnauthorizedKeypairUpdate",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "recoverV_Error",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "TARGET_CONTRACT",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "addr",
              "type": "address"
            },
            {
              "internalType": "bytes32",
              "name": "secret",
              "type": "bytes32"
            },
            {
              "internalType": "uint64",
              "name": "nonce",
              "type": "uint64"
            }
          ],
          "internalType": "struct EthereumKeypair",
          "name": "keypair",
          "type": "tuple"
        }
      ],
      "name": "addKeypair",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "callData",
          "type": "bytes"
        }
      ],
      "name": "decodeTrackTxnParams",
      "outputs": [
        {
          "internalType": "bytes",
          "name": "signedMsg",
          "type": "bytes"
        },
        {
          "internalType": "string",
          "name": "val",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "gasPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "feeRate",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "signedMsg",
          "type": "bytes"
        },
        {
          "internalType": "string",
          "name": "val",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "gasPrice",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "feeRate",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "isInternal",
          "type": "bool"
        }
      ],
      "name": "format",
      "outputs": [
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "keypairIndex",
          "type": "uint256"
        }
      ],
      "name": "getKeypairAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getKeypairCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "innercall",
          "type": "bytes"
        }
      ],
      "name": "makeProxyTx",
      "outputs": [
        {
          "internalType": "bytes",
          "name": "output",
          "type": "bytes"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "innercall",
          "type": "bytes"
        }
      ],
      "name": "preflightCheck",
      "outputs": [
        {
          "internalType": "bool",
          "name": "success",
          "type": "bool"
        },
        {
          "internalType": "string",
          "name": "reason",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "proxy",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    }
  ]