import {AccountID} from "caip";
import {LinkProof} from "./utils";

export interface BlockchainHandlerOpts {
    skipTimestamp?: boolean;
}

export interface BlockchainHandler {
    namespace: string;
    authenticate(message: string, account: AccountID, provider: any): Promise<string>;
    validateLink (proof: LinkProof): Promise<LinkProof | null>;
    createLink (did: string, account: AccountID, provider: any, opts?: BlockchainHandlerOpts): Promise<LinkProof>;
}
