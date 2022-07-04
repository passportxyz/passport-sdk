// --- Test subject
import { PassportScorer } from "../src/scorer";

// Mock DIDKit wasm so that we don't import the browser wasm build into node context
jest.mock("@spruceid/didkit-wasm/didkit_wasm", () => {
  return import("../__mocks__/didkit.js").then((module) => {
    jest.resetModules();
    return module;
  });
});

describe("Passport SDK Scorer", function () {
  it("Can get and score a Passport", async () => {
    // create a new scorer with Scoring Criteria
    const scorer = new PassportScorer([{
      "issuer": "test-issuer",
      "provider": "test-stamp-1",
      "score": 0.5
    }, {
      "issuer": "test-issuer",
      "provider": "test-stamp-2",
      "score": 0.5
    }]);

    // Mock get and verify (verify to return the full state)
    const mockGetPassport = jest.fn();
    const mockVerifyPassport = jest.fn();
    scorer._reader.getPassport = mockGetPassport;
    scorer._verifier.verifyPassport = mockVerifyPassport;

    // mocking only the verify procedure to return a verified stamp (usually verifyPassport() would be passed
    // a complete passport record from getPassport() and would only add the `verified` prop to each stamp)
    mockVerifyPassport.mockReturnValueOnce({
      "issuanceDate": new Date(),
      "expiryDate": new Date(),
      "stamps": [{
        // good stamps count towards the score...
        "provider": "test-stamp-1",
        "credential": {
          "issuer": "test-issuer",
          "credentialSubject": {
            "provider": "test-stamp-1"
          }
        },
        "verified": true
      }, {
        // good stamps count towards the score...
        "provider": "test-stamp-2",
        "credential": {
          "issuer": "test-issuer",
          "credentialSubject": {
            "provider": "test-stamp-2"
          }
        },
        "verified": true
      }, {
        // duplicate stamps are ignored
        "provider": "test-stamp-1",
        "credential": {
          "issuer": "test-issuer",
          "credentialSubject": {
            "provider": "test-stamp-1"
          }
        },
        "verified": true
      }, {
        // stamps which are not in the criteria are ignored
        "provider": "test-stamp-3",
        "credential": {
          "issuer": "test-issuer",
          "credentialSubject": {
            "provider": "test-stamp-3"
          }
        },
        "verified": true
      }]
    });

    // get the score
    const score = await scorer.getScore("0x0");

    // expectations...
    expect(mockGetPassport).toBeCalled();
    expect(mockVerifyPassport).toBeCalled();
    
    // 2 of the 4 stamps we're scored 0.5 each
    expect(score).toEqual(1);
  });
});
