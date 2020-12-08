import { AccountID } from 'caip'
import { LinkProof } from './utils'
import ethereum from './blockchains/ethereum'
import filecoin from './blockchains/filecoin'
import polkadot from './blockchains/polkadot'

const findDID = (did: string): string | undefined => did.match(/(did:(3|muport):[a-zA-Z0-9])\w+/)?.[0]

const handlers = {
  [ethereum.namespace]: ethereum,
  [filecoin.namespace]: filecoin, 
  [polkadot.namespace]: polkadot,
}

async function createLink (
  did: string,
  account: AccountID | string,
  provider: any,
  opts: any = {}
): Promise<LinkProof> {
  if (typeof account === 'string') account = new AccountID(account)
  const handler = handlers[account.chainId.namespace]
  if (!handler) throw new Error(`creating link with namespace '${account.chainId.namespace}' is not supported`)
  const proof = await handler.createLink(did, account, provider, opts)
  if (proof) {
    return proof
  } else {
    throw new Error(`Unable to create proof with namespace '${account.chainId.namespace}'`)
  }
}

async function validateLink (proof: LinkProof): Promise<LinkProof | null> {
  // version < 2 are always eip155 namespace
  let namespace = ethereum.namespace
  if (proof.version >= 2) {
    namespace = (new AccountID(proof.account)).chainId.namespace
  }
  const handler = handlers[namespace]
  if (!handler) throw new Error(`proof with namespace '${namespace}' not supported`)
  const validProof = await handler.validateLink(proof)
  if (validProof) {
    validProof.did = findDID(validProof.message)
    return validProof
  } else {
    return null
  }
}

async function authenticate (
  message: string,
  account: AccountID | string,
  provider: any
): Promise<string> {
  if (typeof account === 'string') account = new AccountID(account)
  const handler = handlers[account.chainId.namespace]
  if (!handler) throw new Error(`authenticate with namespace '${account.chainId.namespace}' not supported`)
  return handler.authenticate(message, account, provider)
}

export {
  LinkProof,
  createLink,
  validateLink,
  authenticate
}
