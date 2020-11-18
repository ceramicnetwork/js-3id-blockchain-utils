import {BlockchainHandler, BlockchainHandlerOpts} from "../blockchain-handler";
import {AccountID} from "caip";
import {ConsentMessage, getConsentMessage, LinkProof} from "../utils";
import type { MessageParams } from '@zondax/filecoin-signing-tools'
import * as uint8arrays from 'uint8arrays'

const namespace = 'fil'

const moduleToImport = process.env.JEST_WORKER_ID ? "@zondax/filecoin-signing-tools/nodejs" : "@zondax/filecoin-signing-tools"

function asTransaction(address: string, message: string): MessageParams {
    const messageParams = uint8arrays.toString(uint8arrays.fromString(message), 'base64')
    return {
        From: address,
        To: address,
        Value: "0",
        Method: 0,
        GasPrice: "1",
        GasLimit: 1000,
        Nonce: 0,
        Params: messageParams,
        GasFeeCap: "1",
        GasPremium: "1"
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
        signature: signatureResponse.Signature.Data,
        account: account.toString()
    }
    if (!opts.skipTimestamp) proof.timestamp = consentMessage.timestamp
    return proof
}

export async function authenticate(message: string, account: AccountID, provider: any): Promise<string> {
    const addresses = await provider.getAccounts()
    const payload = asTransaction(addresses[0], JSON.stringify(message))
    const signatureResponse = await provider.sign(account.address, payload)
    return signatureResponse.Signature.Data
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
    try {
        const recover = signingTools.verifySignature(proof.signature, transaction);
        if (recover) {
            return proof
        } else {
            return null
        }
    } catch {
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
