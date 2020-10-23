interface LinkProof {
  version: number;
  message: string;
  signature: string;
  account: string;
  did?: string;
  timestamp?: number;
  address?: string;
  type?: string;
  chainId?: number;
}

interface RpcMessage {
  jsonrpc: string;
  id: number;
  method: string;
  params: any;
}

export interface ConsentMessage {
  message: string;
  timestamp?: number;
}

function getConsentMessage (did: string, addTimestamp: boolean): ConsentMessage {
  const res: any = {
    message: 'Create a new account link to your identity.' + '\n\n' + did
  }
  if (addTimestamp) {
    res.timestamp = Math.floor(new Date().getTime() / 1000)
    res.message += ' \n' + 'Timestamp: ' + res.timestamp
  }
  return res
}

function encodeRpcMessage (method: string, params: any): any {
  return {
    jsonrpc: '2.0',
    id: 1,
    method,
    params
  }
}

export { LinkProof, RpcMessage, getConsentMessage, encodeRpcMessage }
