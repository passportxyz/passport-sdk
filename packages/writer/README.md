# Gitcoin Passport SDK: Writer

Create, read, and update Gitcoin Passport

## Installation

Add to your project...

```bash
yarn add @gitcoinco/passport-sdk-writer
```

--

Or download this .git repository and install dependencies manually...

```bash
yarn install
```

Build...

```bash
yarn run webpack
```

## Basic Usage

```javascript
import {DID} from "dids";
import {EthereumAuthProvider} from "@3id/connect";

...

// connect to wallet somehow
const provider = wallet.provider;
const address = wallet.accounts[0];

// Create and authenticate a DID
const testDID = new DID({
    provider: new EthereumAuthProvider(provider, address),
});
await testDID.authenticate();

// Construct a writer
const passportWriter = new PassportWriter(testDID);

// Create a Passport belonging to testDID
const passportStreamID = await passportWriter.createPassport();

// Get the Passport by Stream ID
const passport = (await passportWriter.loader.load(passportStreamID)).content;

// Get the Passport belonging to testDID
const testDIDPassport = await passportWriter.getPassport();

// Add a stamp to the Passport belonging to testDID
const newStamp = {
    provider: "An Identity Provider",
    credential: {...a Verifiable Credential...}
};
await passportWriter.addStamp(newStamp);
```

## Ceramic React Framework & Self.ID SDK

[Ceramic Framework Documentation](https://developers.ceramic.network/reference/self-id/modules/framework)

### Configure the Ceramic Provider

The Provider component must be added at the root of the application tree in order to use the hooks described below. It
can be used to provide a custom configuration for the Self.ID clients, authentication, state and UI options.

```javascript
import {Provider} from '@self.id/framework'

function App({children}) {
    return <Provider client={{ceramic: 'testnet-clay'}} session={true}>{children}</Provider>
}
```

### useViewerConnection Hook

Set up useViewerConnection hook to retrieve a user's authenticated DID.

```javascript
import {useViewerConnection} from "@self.id/framework";

const [viewerConnection, connectCeramic, disconnectCeramic] = useViewerConnection();

// connect to wallet somehow
const provider = wallet.provider;
const address = wallet.accounts[0];

connectCeramic(new EthereumAuthProvider(provider, address));

useEffect(() => {
    switch (viewerConnection.status) {
        case "idle": {
            // not connected yet
            break;
        }
        case "connected": {
            // user connected - construct a writer authenticated by user's DID
            const passportWriter = new PassportWriter(viewerConnection.selfID.did);
            // ... do stuff with passport writer ...
            break;
        }
        case "failed": {
            // user refused to connect or authenticate to ceramic
            break;
        }
        default:
            break;
    }
}, [viewerConnection.status]);
```

## Verifiable Credentials

### Requesting Verifiable Credentials from Gitcoin IAM
* Staging server `https://staging.dpopp.gitcoin.co`
* Production server `https://passport-iam.gitcoin.co`

```typescript
// Fetch a verifiable challenge credential to prove user owns their address
export const fetchChallengeCredential = async (
  iamUrl: string = "https://staging.dpopp.gitcoin.co",
  payload: RequestPayload
): Promise<IssuedChallenge> => {
  // fetch challenge as a credential from API that fits the version, address and type (this credential has a short ttl)
  const response: { data: CredentialResponseBody } = await axios.post(
    `${iamUrl}/v${payload.version}/challenge`,
    {
      payload: {
        address: payload.address,
        type: payload.type,
      },
    }
  );

  return {
    challenge: response.data.credential,
  } as IssuedChallenge;
};

// Fetch a verifiableCredential
export const fetchVerifiableCredential = async (
  iamUrl: string = "https://staging.dpopp.gitcoin.co",
  payload: RequestPayload,
  signer: { signMessage: (message: string) => Promise<string> } | undefined
): Promise<VerifiableCredentialRecord> => {
  // must provide signature for message
  if (!signer) {
    throw new Error("Unable to sign message without a signer");
  }

  // first pull a challenge that can be signed by the user
  const {challenge} = await fetchChallengeCredential(iamUrl, payload);

  // sign the challenge provided by the IAM
  const signature = challenge.credentialSubject.challenge
    ? (await signer.signMessage(challenge.credentialSubject.challenge)).toString()
    : "";

  // must provide signature for message
  if (!signature) {
    throw new Error("Unable to sign message");
  }

  // pass the signature as part of the proofs obj
  payload.proofs = {...payload.proofs, ...{signature: signature}};

  // fetch a credential from the API that fits the version, payload and passes the signature message challenge
  const response: { data: CredentialResponseBody } = await axios.post(
    `${iamUrl}/v${payload.version}/verify`,
    {
      payload,
      challenge,
    }
  );

  // return everything that was used to create the credential (along with the credential)
  return {
    signature,
    challenge,
    record: response.data.record,
    credential: response.data.credential,
  } as VerifiableCredentialRecord;
};
```

### Issuing Your Own Verifiable Credentials

Example with [SpruceID DIDKit](https://spruceid.dev/docs/didkit/)

```typescript
import * as DIDKit from "@spruceid/didkit-wasm-node";

const key = process.env.ISSUER_KEY || DIDKit.generateEd25519Key();

// Keeping track of the hashing mechanism (algo + content)
const VERSION = "v0.0.0";

// utility to create an ordered array of the given input (of the form [[key:string, value:string], ...])
const objToSortedArray = (obj: { [k: string]: string }): string[][] => {
  const keys: string[] = Object.keys(obj).sort();
  return keys.reduce((out: string[][], key: string) => {
    out.push([key, obj[key]]);
    return out;
  }, [] as string[][]);
};

// construct and issue a VerifiableCredential via DIDKit
const issueCredential = async (
  subjectAddress: string,
  provider: string,
  record: object,
  expiresInSeconds: number,
): Promise<VerifiableCredential> => {
  // get DID from key
  const issuer = DIDKit.keyToDID("key", key);
  // read method from key
  const verificationMethod = await DIDKit.keyToVerificationMethod("key", key);
  // stringify assertionMethod we feed to didkit-wasm-node
  const verifyWithMethod = JSON.stringify({
    proofPurpose: "assertionMethod",
    verificationMethod,
  });

  const issuanceDate = new Date();
  const expirationDate = new Date();
  expirationDate.setSeconds(issuanceDate.getSeconds() + expiresInSeconds);

  // Generate a hash like SHA256(IAM_PRIVATE_KEY+PII), where PII is the (deterministic) JSON representation
  // of the PII object after transforming it to an array of the form [[key:string, value:string], ...]
  // with the elements sorted by key
  // This hash can be used to de-duplicate provider verifications without revealing PII
  const hash = base64.encode(
    createHash("sha256")
      .update(key, "utf-8")
      .update(JSON.stringify(objToSortedArray(record)))
      .digest()
  );

  // generate a verifiableCredential
  const credential = await DIDKit.issueCredential(
    JSON.stringify({
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential"],
      issuer,
      issuanceDate: issuanceDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      credentialSubject: {
        "@context": [
          {
            hash: "https://schema.org/Text",
            provider: "https://schema.org/Text",
          },
        ],
        // construct a pkh DID on mainnet (:1) for the given wallet address
        id: `did:pkh:eip155:1:${subjectAddress}`,
        provider,
        hash: `${VERSION}:${hash}`,
      },
    }),
    verifyWithMethod,
    key
  );

  // parse the response of the DIDKit wasm
  return JSON.parse(credential) as VerifiableCredential;
};

const exampleVerifiableCredential = issueCredential(
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "Example-Passport-Writer-Provider",
  {myRecord: "my value"},
  600
)
```
