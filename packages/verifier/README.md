# Gitcoin Passport SDK: Verifier

Verify the contents of a Gitcoin Passport

## Installation

Add to your project...

```bash
yarn add @gitcoinco/passport-sdk-verifier
```

--

Or download this .git repository and install deps manually...

```bash
yarn install
```

Build...

```bash
yarn run build
```

## Basic Usage

Firstly, we need to import the library/bundle and construct a `PassportVerifier` instance

```javascript
// import as a module
import PassportVerifier from '@gitcoinco/passport-sdk-verifier';


// or import the bundle
<script src="./dist/verifier.bundle.js" type="script/javascript"/>

...

// create a new instance pointing at the community clay node on mainnet along with the criteria we wish to score against
const verifier = new PassportVerifier();

// Verify a verifiableCredential 
const verified = await verifier.verifyCredential({
  ...
});

```

**Browser Usage**

If you are using this package in a browser, you may need to asynchronously load `@gitcoinco/passport-sdk-verifier`'`
before using.

```javascript
// NextJS Example
const [verifier, setVerifier] = useState();

useEffect(() => {
  const initVerifier = async () => {
    // Dynamically load @gitcoinco/passport-sdk-verifier
    const PassportVerifier = (await import("@gitcoinco/passport-sdk-verifier")).PassportVerifier;
    setVerifier(new PassportVerifier("https://ceramic.staging.dpopp.gitcoin.co"));
  };

  initVerifier().then(() => {
    console.log("Verifier inited :)");
  });
}, []);
```

### PassportVerifier

The `PassportVerifier` instance exposes read-only methods to verify the content of a Gitcoin Passport:

<br/>

- `verifyPassport` - pass in a Passport and get back a Passport whose stamps contain a new field `verified: boolean`
```typescript
PassportVerifier.verifyPassport(address: string, passport?: Passport, additionalStampCheck?: (stamp: Stamp) => boolean): Promise<Passport>
```

- `verifyStamp` - pass in a Stamp and get back a Stamp with the `verified: boolean` field completed
```typescript
PassportVerifier.verifyStamp(address: string, stamp: Stamp, additionalStampCheck?: (stamp: Stamp) => boolean): Promise<Stamp>
```

- `verifyCredential` - pass in a VerifiableCredentail and get back a boolean
```typescript
PassportVerifier.verifyCredential(credential: VerifiableCredential): Promise<boolean>
```

