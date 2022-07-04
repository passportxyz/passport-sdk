// --- Types
import { CeramicGenesis } from "tulons";

// --- Test subject
import { PassportReader } from "../src/reader";

describe("Passport SDK Reader", function () {
  it("Can get Genesis streams from wallet address", async () => {
    // create a new reader instance with defaults
    const reader = new PassportReader();

    // mock the tulons.getGenesis fn 
    const mockGetGenesis = jest.fn();
    mockGetGenesis.mockReturnValueOnce({
      "did": "did:pkh:eip155:1:0x0",
      "streams": {
        "schema-id-1": "stream-id-1"
      }
    });
    reader._tulons.getGenesis = mockGetGenesis;

    // get the genesis (proxy to tulons.getGenesis)
    const genesis = await reader.getGenesis("0x0") as CeramicGenesis;

    // expectations...
    expect(reader._tulons.getGenesis).toBeCalledWith("0x0");
    expect(genesis.streams).toStrictEqual({
      "schema-id-1": "stream-id-1"
    });
  });

  it("Can get Passport Stream from a wallet address", async () => {
    // create a new reader instance with defaults
    const reader = new PassportReader();

    // mock tulons fns
    const mockGetGenesis = jest.fn();
    mockGetGenesis.mockReturnValueOnce({
      "did": "",
      "streams": {
        [reader._ceramic_gitcoin_passport_stream_id]: "test",
      }
    });
    reader._tulons.getStream = jest.fn();
    reader._tulons.getGenesis = mockGetGenesis;

    // get the passport stream (read via tulons)
    await reader.getPassportStream("0x0");

    // expectations...
    expect(reader._tulons.getGenesis).toBeCalledWith("0x0", [
      reader._ceramic_gitcoin_passport_stream_id,
    ]);
    expect(reader._tulons.getStream).toBeCalledWith("test");
  });

  it("Can get Passport from a wallet address and hydrate all Stamps from ceramic:// links", async () => {
    // create a new reader instance with defaults
    const reader = new PassportReader();

    // mock tulons fns
    const mockGetGenesis = jest.fn();
    mockGetGenesis.mockReturnValueOnce({
      "did": "",
      "streams": {
        [reader._ceramic_gitcoin_passport_stream_id]: "test",
      }
    });
    const mockGetStream = jest.fn();
    mockGetStream
      .mockReturnValueOnce({
        "issuanceDate": "2022-05-13T02:34:35.341Z",
        "expiryDate": "2022-05-13T02:34:35.341Z",
        "stamps": [
          {
            "provider": "Simple",
            "credential": "ceramic://kjzl6c...",
          },
        ],
      })
    const mockGetStreams = jest.fn();
    mockGetStreams
        .mockReturnValueOnce({
          "kjzl6c...": {
            "type": ["VerifiableCredential"],
          }
        })
    reader._tulons.getGenesis = mockGetGenesis;
    reader._tulons.getStream = mockGetStream;
    reader._tulons.getStreams = mockGetStreams;

    // get the hydrated passport stream (read via tulons)
    const passport = await reader.getPassport("0x0");

    // expectations...
    expect(reader._tulons.getStream).toBeCalledWith("test");
    expect(reader._tulons.getStreams).toBeCalledWith(["ceramic://kjzl6c..."]);

    expect(passport).toStrictEqual({
      "issuanceDate": "2022-05-13T02:34:35.341Z",
      "expiryDate": "2022-05-13T02:34:35.341Z",
      "stamps": [
        {
          "provider": "Simple",
          "credential": {
            "type": ["VerifiableCredential"],
          },
        },
      ],
    });
  });
});
