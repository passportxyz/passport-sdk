# Gitcoin Passport SDK: Writer

## Explain how to set up react with ceramic provider and pass in the connection?

```

  import { DID } from "dids";
  import { EthereumAuthProvider } from "@3id/connect";

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

  // Create a Passport
  const passportStreamID = await passportWriter.createPassport();

  // Get the Passport
  const passport = (await passportWriter.loader.load(passportStreamID)).content;

```