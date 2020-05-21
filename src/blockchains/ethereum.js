import { ADDRESS_TYPES } from '../constants'
import { getConsentMessage, encodeRpcCall } from '../utils'
import { verifyMessage } from '@ethersproject/wallet'
import { Contract } from '@ethersproject/contracts'
import * as providers from "@ethersproject/providers"
import { sha256  } from 'js-sha256'

const ERC1271_ABI = [ 'function isValidSignature(bytes _messageHash, bytes _signature) public view returns (bytes4 magicValue)' ]
const MAGIC_ERC1271_VALUE = '0x20c13b0b'
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
  const payload = encodeRpcCall('eth_getCode', [address, 'latest'])
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

async function createEthLink (did, address, provider, opts = {}) {
  const { message, timestamp } = getConsentMessage(did, !opts.skipTimestamp)
  const hexMessage = '0x' + Buffer.from(message, 'utf8').toString('hex')
  const payload = encodeRpcCall('personal_sign', [hexMessage, address])
  const signature = await safeSend(payload, provider)
  const proof = {
    version: 1,
    type: ADDRESS_TYPES.ethereumEOA,
    message,
    signature,
    address
  }
  if (!opts.skipTimestamp) proof.timestamp = timestamp
  return proof
}

async function createErc1271Link (did, address, provider, opts) {
  const res = await createEthLink(did, address, provider, opts)
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

async function createLink (did, address, type, provider, opts) {
  address = address.toLowerCase()
  if (type === ADDRESS_TYPES.ethereumEOA) {
    return createEthLink(did, address, provider, opts)
  } else if (type === ADDRESS_TYPES.erc1271) {
    return createErc1271Link(did, address, provider, opts)
  }
}

async function validateEoaLink (proof) {
  const recoveredAddr = verifyMessage(proof.message, proof.signature).toLowerCase()
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
  const message = '0x' + Buffer.from(proof.message, 'utf8').toString('hex')
  const returnValue = await contract.isValidSignature(message, proof.signature)

  return returnValue === MAGIC_ERC1271_VALUE ? proof : null
}

async function validateLink (proof) {
  if (proof.type === ADDRESS_TYPES.ethereumEOA) {
    return validateEoaLink(proof)
  } else if (proof.type === ADDRESS_TYPES.erc1271) {
    return validateErc1271Link(proof)
  }
}

async function authenticate(message, address, provider) {
  if (address) address = address.toLowerCase()
  if (provider.isAuthereum) return provider.signMessageWithSigningKey(text)
  const hexMessage  = '0x' + Buffer.from(message, 'utf8').toString('hex')
  const payload = encodeRpcCall('personal_sign', [hexMessage, address])
  const signature = await safeSend(payload, provider)
  if (address) {
    const recoveredAddr = verifyMessage(message, signature).toLowerCase()
    if (address !== recoveredAddr) throw new Error('Provider returned signature from different account than requested')
  }
  return `0x${sha256(signature.slice(2))}`
}

export default {
  authenticate,
  validateLink,
  createLink,
  typeDetector
}
