import { ADDRESS_TYPES } from '../constants'
import { getConsentMessage, encodeRpcMessage, RpcMessage, LinkProof } from '../utils'
import { verifyMessage } from '@ethersproject/wallet'
import { Contract } from '@ethersproject/contracts'
import * as providers from "@ethersproject/providers"
import { sha256  } from 'js-sha256'

const ERC1271_ABI = [ 'function isValidSignature(bytes _messageHash, bytes _signature) public view returns (bytes4 magicValue)' ]
const MAGIC_ERC1271_VALUE = '0x20c13b0b'
const isEthAddress = (address: string): boolean => /^0x[a-fA-F0-9]{40}$/.test(address)
//const namespace = 'eip155'


async function safeSend (data: RpcMessage, provider: any): Promise<any> {
  const send = (provider.sendAsync ? provider.sendAsync : provider.send).bind(provider)
  return new Promise((resolve, reject) => {
    send(data, function(err, result) {
      if (err) reject(err)
      else if (result.error) reject(result.error)
      else resolve(result.result)
    })
  })
}

function getEthersProvider (chainId: number): any {
  const network = providers.getNetwork(chainId)
  if (!network._defaultProvider) throw new Error(`Network with chainId ${chainId} is not supported`)
  return network._defaultProvider(providers)
}

async function getChainId (provider: any): number {
  const payload = encodeRpcMessage('eth_chainId', [])
  const chainIdHex = await safeSend(payload, provider)
  return parseInt(chainIdHex, 16)
}

async function getCode (address: string, provider: any): string {
  const payload = encodeRpcMessage('eth_getCode', [address, 'latest'])
  const code = await safeSend(payload, provider)
  return code
}

async function createEthLink (
  did: string,
  address: string,
  provider: any,
  opts: any = {}
): Promise<LinkProof> {
  const { message, timestamp } = getConsentMessage(did, !opts.skipTimestamp)
  const hexMessage = '0x' + Buffer.from(message, 'utf8').toString('hex')
  const payload = encodeRpcMessage('personal_sign', [hexMessage, address])
  const signature = await safeSend(payload, provider)
  const proof: LinkProof = {
    version: 1,
    type: ADDRESS_TYPES.ethereumEOA,
    message,
    signature,
    address
  }
  if (!opts.skipTimestamp) proof.timestamp = timestamp
  return proof
}

async function createErc1271Link (
  did: string,
  address: string,
  provider: any,
  opts: any
): Promise<LinkProof> {
  const res = await createEthLink(did, address, provider, opts)
  const chainId = await getChainId(provider)
  return Object.assign(res, {
    type: ADDRESS_TYPES.erc1271,
    chainId,
  })
}

async function typeDetector (address): Promise<any> {
  return isEthAddress(address) ? ADDRESS_TYPES.ethereum : false
}

async function isERC1271 (address: string, provider: any): Promise<boolean> {
  const bytecode = await getCode(address, provider).catch(() => null)
  return bytecode && bytecode !== '0x' && bytecode !== '0x0' && bytecode !== '0x00'
}

async function createLink (
  did: string,
  address: string,
  provider: any,
  opts: any
): Promise<LinkProof> {
  address = address.toLowerCase()
  if (!(await isERC1271(address, provider))) {
    return createEthLink(did, address, provider, opts)
  } else {
    return createErc1271Link(did, address, provider, opts)
  }
}

async function validateEoaLink (proof: LinkProof): Promise<LinkProof> {
  const recoveredAddr = verifyMessage(proof.message, proof.signature).toLowerCase()
  if (proof.address && proof.address !== recoveredAddr) {
    return null
  } else {
    proof.address = recoveredAddr
  }
  return proof
}

async function validateErc1271Link (proof: LinkProof): Promise<LinkProof> {
  const provider = getEthersProvider(proof.chainId)
  const contract = new Contract(proof.address, ERC1271_ABI, provider)
  const message = '0x' + Buffer.from(proof.message, 'utf8').toString('hex')
  const returnValue = await contract.isValidSignature(message, proof.signature)

  return returnValue === MAGIC_ERC1271_VALUE ? proof : null
}

async function validateLink (proof: LinkProof): Promise<LinkProof> {
  if (proof.type === ADDRESS_TYPES.ethereumEOA) {
    return validateEoaLink(proof)
  } else if (proof.type === ADDRESS_TYPES.erc1271) {
    return validateErc1271Link(proof)
  }
}

async function authenticate(
  message: string,
  address: string,
  provider: any
): Promise<string> {
  if (address) address = address.toLowerCase()
  if (provider.isAuthereum) return provider.signMessageWithSigningKey(text)
  const hexMessage  = '0x' + Buffer.from(message, 'utf8').toString('hex')
  const payload = encodeRpcMessage('personal_sign', [hexMessage, address])
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
  typeDetector,
  isERC1271,
  isEthAddress
}
