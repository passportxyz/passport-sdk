// --- Types
import { Passport, PROVIDER_ID, Stamp } from "@gitcoinco/passport-sdk-types";

// --- Test subject
import { PassportVerifier } from "../src/verifier";

// Mock DIDKit wasm so that we don't import the browser wasm build into node context
jest.mock("@spruceid/didkit-wasm/didkit_wasm", () => {
  return import("../__mocks__/didkit.js").then((module) => {
    jest.resetModules();
    return module;
  });
});

// ensures expiry is in the future
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 1);

// Mock VerifiableCredential
const credential = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "issuanceDate": new Date().toString(),
  "expirationDate": expiryDate.toString(),
  "issuer": "test-issuer",
  "type": ["VerifiableCredential"],
  "credentialSubject": {
    "@context": [{
      "hash": "https://schema.org/Text",
      "provider": "https://schema.org/Text",
    }],
    "id": "did:pkh:eip155:1:0x0...",
    "provider": "test-stamp",
    "hash": "v0.0.0:hash-value"
  },
  // proof is added by DIDKit when issuing the credential
  "proof": {
    "type": "",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "",
    "created": "",
    "jws": "",
  }
};

// Mock Stamp
const stamp = {
  "provider": "test-stamp" as unknown as PROVIDER_ID,
  "credential": credential
};

// Mock Passport
const passport = {
  "issuanceDate": new Date(),
  "expiryDate": expiryDate,
  "stamps": [stamp]
};

describe("Passport SDK Verifier", function () {
  it("Can verify Passport", async () => {
    // create a new verifier with defaults
    const verifier = new PassportVerifier();

    // mock the verify procedure to return a verified stamp
    const mockGetPassport = jest.fn();
    mockGetPassport.mockReturnValueOnce(passport);
    verifier._reader.getPassport = mockGetPassport;  

    // verify the passport
    const verifiedPassport = await verifier.verifyPassport("0x0...") as Passport;

    // check passport was loaded via reader
    expect(mockGetPassport).toBeCalled();
    // check verifyCredential was called
    expect(verifier._DIDKit.verifyCredential).toBeCalled();

    // check that the stamp was marked as verified
    expect(verifiedPassport.stamps[0].verified).toBe(true);
  });

  it("Can verify Stamp", async () => {
    // create a new verifier with defaults
    const verifier = new PassportVerifier();

    // verify the stamp
    const verifiedStamp = await verifier.verifyStamp("0x0...", stamp) as unknown as Stamp;

    // check verifyCredential was called
    expect(verifier._DIDKit.verifyCredential).toBeCalled();
    
    // check that the stamp was marked as verified
    expect(verifiedStamp.verified).toBe(true);
  });

  it("Can verify verifiableCredential", async () => {
    // create a new verifier with defaults
    const verifier = new PassportVerifier();

    // verify the credential
    const verified = await verifier.verifyCredential(credential);

    // check verifyCredential was called
    expect(verifier._DIDKit.verifyCredential).toBeCalled();
    
    // check that the credential verified
    expect(verified).toBe(true);
  });
});
