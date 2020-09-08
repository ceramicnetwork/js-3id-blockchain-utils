import {BlockchainHandler, BlockchainHandlerOpts} from "../blockchain-handler";
import {AccountID} from "caip";
import {ConsentMessage, getConsentMessage, LinkProof} from "../utils";
import type { MessageParams } from '@zondax/filecoin-signing-tools'

const namespace = 'fil'

const moduleToImport = process.env.JEST_WORKER_ID ? "@zondax/filecoin-signing-tools/nodejs" : "@zondax/filecoin-signing-tools"

function asTransaction(address: string, message: string): MessageParams {
    const messageHex = Buffer.from(message).toString('hex')
    return {
        from: address,
        to: address,
        value: "0",
        method: 0,
        gasPrice: "1",
        gasLimit: 1000,
        nonce: 0,
        params: messageHex
    }
}

export async function createLink (did: string, account: AccountID, provider: any, opts: BlockchainHandlerOpts): Promise<LinkProof> {
    const consentMessage = getConsentMessage(did, !opts.skipTimestamp)
    const addresses = await provider.getAccounts()
    const payload = asTransaction(addresses[0], JSON.stringify(consentMessage))
    const signatureResponse = await provider.sign(account.address, payload)
    const proof: LinkProof = {
        version: 2,
        type: 'eoa-tx',
        message: consentMessage.message,
        signature: signatureResponse.signature.data,
        account: account.toString()
    }
    if (!opts.skipTimestamp) proof.timestamp = consentMessage.timestamp
    return proof
}

export async function authenticate(message: string, account: AccountID, provider: any): Promise<string> {
    const addresses = await provider.getAccounts()
    const payload = asTransaction(addresses[0], JSON.stringify(message))
    const signatureResponse = await provider.sign(account.address, payload)
    return signatureResponse.signature.data
}

export async function validateLink (proof: LinkProof): Promise<LinkProof | null> {
    const signingTools = await import(moduleToImport)
    const account = new AccountID(proof.account)
    const consentMessage: ConsentMessage = {
        message: proof.message,
    }
    if (proof.timestamp) {
        consentMessage.timestamp = proof.timestamp
    }
    const payload = asTransaction(account.address, JSON.stringify(consentMessage))
    const transaction = signingTools.transactionSerialize(payload);
    const recover = signingTools.verifySignature(proof.signature, transaction);
    if (recover) {
        return proof
    } else {
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
