import { AccountID } from 'caip'
import {SigningTools} from '@smontero/eosio-signing-tools'
import {BlockchainHandler, BlockchainHandlerOpts} from "../blockchain-handler";
import { getConsentMessage, LinkProof } from '../utils'

const maxWordLength = 12
const namespace = 'eosio'

function normalizeAccountId (account: AccountID): AccountID {
  account.address = account.address.toLowerCase()
  return account
}

function toCAIPChainId(chainId: string): string{
  return chainId.substr(0,32)
}

function sanitize (str: string, size: number): string{
  return str.replace(/\s/g, ' ').replace(new RegExp(`(\\S{${size}})`, 'g'), '$1 ')
}

function toPayload(message: string, accountID: AccountID ): string {
  const {
    address,
    chainId
  } = accountID
  const payload = `${message} [For: ${address} on chain: ${chainId}]`
  return sanitize(payload, maxWordLength)
}

async function toSignedPayload(
  message: string,
  accountID: AccountID,
  provider: any 
): Promise <string> { 
  accountID = normalizeAccountId(accountID)
  const {
    chainId:{
      reference:requestedChainId
    },
    address
  } = accountID
  const accountName = await provider.getAccountName()
  const chainId = toCAIPChainId(await provider.getChainId())
  
  if(chainId !== requestedChainId){
    throw new Error(`Provider returned a different chainId than requested [returned: ${chainId}, requested: ${requestedChainId}]`)
  }
  if(accountName !== address){
     throw new Error(`Provider returned a different account than requested [returned: ${accountName}, requested: ${address}]`)
  }
  const payload = toPayload(message, accountID)
  const [key] = await provider.getKeys()
  return provider.signArbitrary(key, payload)

}


export async function authenticate(
  message: string,
  accountID: AccountID,
  provider: any
): Promise<string> {
  const signedPayload = await toSignedPayload(message, accountID, provider)
  return signedPayload
}

export async function createLink (did: string, accountID: AccountID, provider: any, opts: BlockchainHandlerOpts): Promise<LinkProof> {
  const consentMessage = getConsentMessage(did, !opts.skipTimestamp)
  const signedPayload = await toSignedPayload(consentMessage.message, accountID, provider)
  const proof: LinkProof = {
      version: 1,
      type: 'eosio',
      message: consentMessage.message,
      signature: signedPayload,
      account: accountID.toString()
  }
  if (!opts.skipTimestamp) proof.timestamp = consentMessage.timestamp
  console.log('proof: ', proof)
  return proof
}

export async function validateLink (proof: LinkProof): Promise<LinkProof | null> {
  const {
    message,
    signature,
    account
  } = proof
  const accountID = new AccountID(account)
  const {address, chainId} = accountID
  try {

      const success = await SigningTools.verifySignature({
        chainId: chainId.reference,
        account: address,
        signature,
        data: toPayload(message, accountID)
      });
      return success ? proof : null
  } catch (error) {
      // console.error(error)
      return null
  }
}


const Handler: BlockchainHandler = {
  namespace,
  authenticate,
  validateLink,
  createLink
}

export default Handler
