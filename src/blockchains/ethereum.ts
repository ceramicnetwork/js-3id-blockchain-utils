import { getConsentMessage, encodeRpcMessage, RpcMessage, LinkProof } from '../utils'
import { verifyMessage } from '@ethersproject/wallet'
import { Contract } from '@ethersproject/contracts'
import * as providers from "@ethersproject/providers"
import { AccountID } from 'caip'
import { sha256  } from 'js-sha256'
import * as uint8arrays from 'uint8arrays'

const ADDRESS_TYPES = {
  ethereumEOA: 'ethereum-eoa',
  erc1271: 'erc1271'
}
const ERC1271_ABI = [ 'function isValidSignature(bytes _messageHash, bytes _signature) public view returns (bytes4 magicValue)' ]
const MAGIC_ERC1271_VALUE = '0x20c13b0b'
const isEthAddress = (address: string): boolean => /^0x[a-fA-F0-9]{40}$/.test(address)
const namespace = 'eip155'


function normalizeAccountId (account: AccountID): AccountID {
  account.address = account.address.toLowerCase()
  return account
}

function utf8toHex(message: string): string {
  const bytes = uint8arrays.fromString(message)
  const hex = uint8arrays.toString(bytes, 'base16')
  return '0x' + hex
}

async function safeSend (data: RpcMessage, provider: any): Promise<any> {
  const send = (provider.sendAsync ? provider.sendAsync : provider.send).bind(provider)
  return new Promise((resolve, reject) => {
    send(data, function(err: any, result: any) {
      if (err) reject(err)
      else if (result.error) reject(result.error)
      else resolve(result.result)
    })
  })
}

function getEthersProvider (chainId: string): any {
  const network = providers.getNetwork(chainId)
  if (!network._defaultProvider) throw new Error(`Network with chainId ${chainId} is not supported`)
  return network._defaultProvider(providers)
}

async function getCode (address: string, provider: any): Promise<string> {
  const payload = encodeRpcMessage('eth_getCode', [address, 'latest'])
  const code = await safeSend(payload, provider)
  return code
}

async function validateChainId (account: AccountID, provider: any): Promise<void> {
  const payload = encodeRpcMessage('eth_chainId', [])
  const chainIdHex = await safeSend(payload, provider)
  const chainId = parseInt(chainIdHex, 16)
  if (chainId !== parseInt(account.chainId.reference)) {
    throw new Error(`ChainId in provider (${chainId}) is different from AccountID (${account.chainId.reference})`)
  }
}

async function createEthLink (
  did: string,
  account: AccountID,
  provider: any,
  opts: any = {}
): Promise<LinkProof> {
  const { message, timestamp } = getConsentMessage(did, !opts.skipTimestamp)
  const hexMessage = utf8toHex(message)
  const payload = encodeRpcMessage('personal_sign', [hexMessage, account.address])
  const signature = await safeSend(payload, provider)
  const proof: LinkProof = {
    version: 2,
    type: ADDRESS_TYPES.ethereumEOA,
    message,
    signature,
    account: account.toString()
  }
  if (!opts.skipTimestamp) proof.timestamp = timestamp
  return proof
}

async function createErc1271Link (
  did: string,
  account: AccountID,
  provider: any,
  opts: any
): Promise<LinkProof> {
  const ethLinkAccount = opts?.eoaSignAccount || account
  const res = await createEthLink(did, ethLinkAccount, provider, opts)
  await validateChainId(account, provider)
  return Object.assign(res, {
    type: ADDRESS_TYPES.erc1271,
    account: account.toString()
  })
}

async function isERC1271 (account: AccountID, provider: any): Promise<boolean> {
  const bytecode = await getCode(account.address, provider).catch(() => null)
  return Boolean(bytecode && bytecode !== '0x' && bytecode !== '0x0' && bytecode !== '0x00')
}

async function createLink (
  did: string,
  account: AccountID,
  provider: any,
  opts: any
): Promise<LinkProof> {
  account = normalizeAccountId(account)
  if (await isERC1271(account, provider)) {
    return createErc1271Link(did, account, provider, opts)
  } else {
    return createEthLink(did, account, provider, opts)
  }
}

function toV2Proof (proof: LinkProof, address?: string): LinkProof {
  proof.account = new AccountID({
    address: ((proof.version === 1) ? proof.address : address) || '',
    chainId: { namespace, reference: proof.chainId ? proof.chainId.toString() : '1' }
  }).toString()
  delete proof.address
  delete proof.chainId
  proof.version = 2
  return proof
}

async function validateEoaLink (proof: LinkProof): Promise<LinkProof | null> {
  const recoveredAddr = verifyMessage(proof.message, proof.signature).toLowerCase()
  if (proof.version !== 2) proof = toV2Proof(proof, recoveredAddr)
  const account = new AccountID(proof.account)
  if (account.address !== recoveredAddr) {
    return null
  }
  return proof
}

async function validateErc1271Link (proof: LinkProof): Promise<LinkProof | null> {
  if (proof.version === 1) proof = toV2Proof(proof)
  const account = new AccountID(proof.account)
  const provider = getEthersProvider(account.chainId.reference)
  const contract = new Contract(account.address, ERC1271_ABI, provider)
  const message = utf8toHex(proof.message)
  const returnValue = await contract.isValidSignature(message, proof.signature)

  return returnValue === MAGIC_ERC1271_VALUE ? proof : null
}

async function validateLink (proof: LinkProof): Promise<LinkProof | null> {
  if (proof.type === ADDRESS_TYPES.erc1271) {
    return validateErc1271Link(proof)
  }
  return validateEoaLink(proof)
}

async function authenticate(
  message: string,
  account: AccountID,
  provider: any
): Promise<string> {
  if (account) account = normalizeAccountId(account)
  if (provider.isAuthereum) return provider.signMessageWithSigningKey(message)
  const hexMessage  = utf8toHex(message)
  const payload = encodeRpcMessage('personal_sign', [hexMessage, account.address])
  const signature = await safeSend(payload, provider)
  if (account) {
    const recoveredAddr = verifyMessage(message, signature).toLowerCase()
    if (account.address !== recoveredAddr) throw new Error('Provider returned signature from different account than requested')
  }
  return `0x${sha256(signature.slice(2))}`
}

export default {
  authenticate,
  validateLink,
  createLink,
  namespace,
  isERC1271,
  isEthAddress
}
