# Gitcoin Passport SDK: Reader

Reads from any Gitcoin Passport stream (on Ceramic)

## Installation

Add to your project...

```bash
yarn add @gitcoinco/passport-sdk-reader
```

--

Or download this .git repository and install dependencies manually...

```bash
yarn install
```

Build...

```bash
yarn run build
```

## Usage

Firstly, we need to import the library/bundle and construct a `PassportReader` instance, passing in a ceramic node URL and a networkId

```js
// add to your project as a module
import PassportReader from '@gitcoinco/passport-sdk-reader'

// or import the bundle
<script src="./dist/reader.bundle.js" type="script/javascript"/>

...

// create a new instance pointing at the community clay node on mainnet
const reader = new PassportReader('https://ceramic-clay.3boxlabs.com', '1');

// read a Passport from Ceramic
const passport = await reader.getPassport("0x0...");

```

<br/>

The `PassportReader` instance exposes read-only methods to get the content of a Gitcoin Passport:

<br/>


- `getGenesis` - pass in an Ethereum address and get back the did:pkh and genesis IDX streams
```typescript
reader.getGenesis(address: string): Promise<CeramicGenesis | false>
```

- `getPassport` - pass in an Ethereum address and get back a fully hydrated Passport record
```typescript
reader.getPassport(address: string): Promise<CeramicPassport | CeramicCredentialPassport | false>
```

- `getPassportStream` - pass in a Ceramic DID and get back a raw Passport stream record *note that this is a shallow copy of the passport (and needs to have its stamps hydrated)
```typescript
reader.getPassportStream(address: string): Promise<CeramicPassport | false>
``` 
