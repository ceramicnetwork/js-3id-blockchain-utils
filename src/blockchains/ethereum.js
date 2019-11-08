import { ADDRESS_TYPES } from '../constants'
import { getConsentMessage } from '../utils'
import { verifyMessage } from '@ethersproject/wallet'
import { Contract } from '@ethersproject/contracts'
import * as providers from "@ethersproject/providers";

const ERC1271_ABI = [ 'function isValidSignature(bytes _messageHash, bytes _signature) public view returns (bytes4 magicValue)' ]
const MAGIC_ERC1271_VALUE = '0x20c13b0b'
const encodeRpcCall = (method, params) => ({
  jsonrpc: '2.0',
  id: 1,
  method,
  params
})
const isEthAddress = address => /^0x[a-fA-F0-9]{40}$/.test(address)


function getEthersProvider (chainId) {
  const network = providers.getNetwork(chainId)
  if (!network._defaultProvider) throw new Error(`Network with chainId ${chainId} is not supported`)
  return network._defaultProvider(providers)
}

async function getChainId (provider) {
  const payload = encodeRpcCall('eth_chainId', [])
  const chainIdHex = await safeSend(payload, provider)
  return parseInt(chainIdHex, 16)
}

async function getCode (address, provider) {
  const payload = encodeRpcCall('eth_getCode', [address])
  const code = await safeSend(payload, provider)
  return code
}

async function safeSend (data, provider) {
  const send = (Boolean(provider.sendAsync) ? provider.sendAsync : provider.send).bind(provider)
  return new Promise((resolve, reject) => {
    send(data, function(err, result) {
      if (err) reject(err)
      else if (result.error) reject(result.error)
      else resolve(result.result)
    })
  })
}

async function createEthLink (address, provider) {
  const { message, timestamp } = getConsentMessage(did, true)
  const payload = encodeRpcCall('personal_sign', [message, address])
  const signature = await safeSend(payload, provider)
  return {
    version: 1,
    type: ADDRESS_TYPES.ethereumEOA,
    message,
    timestamp,
    signature,
    address
  }
}

async function createErc1271Link (address, provider) {
  const res = await createEthLink(address, provider)
  const chainId = await getChainId(provider)
  return Object.assign(res, {
    type: ADDRESS_TYPES.erc1271,
    chainId,
  })
}

async function typeDetector (address, provider) {
  if (!isEthAddress(address)) {
    return false
  }
  const bytecode = await getCode(address, provider).catch(() => null)
  if (!bytecode || bytecode === '0x' || bytecode === '0x0' || bytecode === '0x00') {
    return ADDRESS_TYPES.ethereumEOA
  }
  return ADDRESS_TYPES.erc1271
}

async function createLink (address, type, provider) {
  address = address.toLowerCase()
  if (type === ADDRESS_TYPES.ethereumEOA) {
    return createEthLink(address, provider)
  } else if (type === ADDRESS_TYPES.erc1271) {
    return createErc1271Link(address, provider)
  }
}

async function validateEoaLink (proof) {
  const recoveredAddr = verifyMessage(proof.message, proof.signature)
  if (proof.address && proof.address !== recoveredAddr) {
    return null
  } else {
    proof.address = recoveredAddr
  }
  return proof
}

async function validateErc1271Link (proof) {
  const provider = getEthersProvider(proof.chainId)
  const contract = new Contract(proof.address, ERC1271_ABI, provider)
  const message = '0x' + Buffer.from(linkObj.message, 'utf8').toString('hex')
  const returnValue = await contract.isValidSignature(message, linkObj.signature)

  return returnValue === MAGIC_ERC1271_VALUE ? proof : null
}

async function validateLink (proof) {
  if (proof.type === ADDRESS_TYPES.ethereumEOA) {
    return validateEoaLink(proof)
  } else if (proof.type === ADDRESS_TYPES.ethereumEOA) {
    return validateErc1271Link(proof)
  }
}

export {
  validateLink,
  createLink,
  typeDetector
}

