import polkadot from "../polkadot";
import { AccountID } from "caip";
import { Signer, SignerResult } from '@polkadot/api/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { SignerPayloadRaw } from '@polkadot/types/types';
import { TypeRegistry } from '@polkadot/types/create';
import createTestKeyring from '@polkadot/keyring/testing';
import { assert, hexToU8a, u8aToHex } from '@polkadot/util';
import { waitReady } from '@polkadot/wasm-crypto';

const did = 'did:3:bafysdfwefwe'
const net = 'polkadot:b0a8d493285c2df73290dfb7e61f870f'
const seed = hexToU8a('0xabf8e00000000000000000000000000000000000000000000000000000000000')

// primary and supported by polkadot extension
const keyringSr25519 = createTestKeyring({ type: 'sr25519' })
const keyringEd25519 = createTestKeyring({ type: 'ed25519' })
const keyringSecp256k = createTestKeyring({ type: 'ecdsa' })

const addressToAccountID = (address: string): AccountID => new AccountID(`${address}@${net}`)

class SingleAccountSigner implements Signer {
    readonly #keyringPair: KeyringPair;

    constructor (registry: TypeRegistry, keyringPair: KeyringPair) {
        this.#keyringPair = keyringPair
    }

    public async signRaw ({ address, data }: SignerPayloadRaw): Promise<SignerResult> {
        assert(address === this.#keyringPair.address, 'Signer does not have the keyringPair');
    
        return new Promise((resolve): void => {
            const signature = u8aToHex(this.#keyringPair.sign(hexToU8a(data)));
            resolve({ id: 1, signature })
        })
    }
}

describe('Blockchain: Polkadot', () => {
    const registry = new TypeRegistry()
    let keyPairSr25519, keyPairEd25519, keyPairSecp256k 

    beforeAll(async () => {
        await waitReady();
        keyPairSr25519 = keyringSr25519.addFromSeed(seed)
        keyPairEd25519 = keyringEd25519.addFromSeed(seed)
        keyPairSecp256k = keyringSecp256k.addFromSeed(seed)
    })

    describe('createLink', () => {
        test('create proof with sr25519', async () => {
            const account = addressToAccountID(keyPairSr25519.address)
            const provider = new SingleAccountSigner(registry, keyPairSr25519)
            const proof = await polkadot.createLink(did, account, provider)
            console.log(proof)
            expect(proof).toMatchSnapshot()
        })
        test('create proof with ed25519', async () => {
            const account = addressToAccountID(keyPairEd25519.address)
            const provider = new SingleAccountSigner(registry, keyPairEd25519)
            const proof = await polkadot.createLink(did, account, provider)
            expect(proof).toMatchSnapshot()
        })
        test('create proof with secp256k', async () => {
            const account = addressToAccountID(keyPairSecp256k.address)
            const provider = new SingleAccountSigner(registry, keyPairSecp256k)
            const proof = await polkadot.createLink(did, account, provider)
            expect(proof).toMatchSnapshot()
        })
    })

    describe('validateLink', () => {
        test('validate proof with sr25519', async () => {
            const account = addressToAccountID(keyPairSr25519.address)
            const provider = new SingleAccountSigner(registry, keyPairSr25519)
            const proof = await polkadot.createLink(did, account, provider)
            await expect(polkadot.validateLink(proof)).resolves.toEqual(proof)
        })
        test('validate proof with ed25519', async () => {
            const account = addressToAccountID(keyPairEd25519.address)
            const provider = new SingleAccountSigner(registry, keyPairEd25519)
            const proof = await polkadot.createLink(did, account, provider)
            await expect(polkadot.validateLink(proof)).resolves.toEqual(proof)
        })
        test('validate proof with secp256k', async () => {
            const account = addressToAccountID(keyPairSecp256k.address)
            const provider = new SingleAccountSigner(registry, keyPairSecp256k)
            const proof = await polkadot.createLink(did, account, provider)
            await expect(polkadot.validateLink(proof)).resolves.toEqual(proof)
        })
    })

    describe('authenticate', () => {
        test('authenticate with sr25519', async () => {
            const account = addressToAccountID(keyPairSr25519.address)
            const provider = new SingleAccountSigner(registry, keyPairSr25519)
            const authSecret = await polkadot.authenticate('msg', account, provider)
            expect(authSecret).toMatchSnapshot()
        })
        test('authenticate with ed25519', async () => {
            const account = addressToAccountID(keyPairEd25519.address)
            const provider = new SingleAccountSigner(registry, keyPairEd25519)
            const authSecret = await polkadot.authenticate('msg', account, provider)
            expect(authSecret).toMatchSnapshot()
        })
        test('authenticate with secp256k', async () => {
            const account = addressToAccountID(keyPairSecp256k.address)
            const provider = new SingleAccountSigner(registry, keyPairSecp256k)
            const authSecret = await polkadot.authenticate('msg', account, provider)
            expect(authSecret).toMatchSnapshot()
        })
    })

})
