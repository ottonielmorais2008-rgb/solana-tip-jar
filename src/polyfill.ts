import { Buffer } from 'buffer'

// web3.js transaction data is typed as Buffer. The browser bundle does not
// provide that global, so a tip cannot be serialized until it is installed.
globalThis.Buffer = Buffer
