
/* eslint-disable @typescript-eslint/unbound-method */
import { CeramicGenesis } from "tulons";
import { PassportReader } from "../src/reader";

test("Can get Genesis streams from wallet address", async () => {
  const reader = new PassportReader();

  const mockGetGenesis = jest.fn();
  mockGetGenesis.mockReturnValueOnce({
    did: "did:pkh:eip155:1:0x0",
    streams: {
      'schema-id-1': 'stream-id-1'
    }
  });

  reader._tulons.getGenesis = mockGetGenesis;

  const genesis = await reader.getGenesis("0x0") as CeramicGenesis;

  expect(reader._tulons.getGenesis).toBeCalledWith("0x0");
  expect(genesis.streams).toStrictEqual({
    'schema-id-1': 'stream-id-1'
  });
});

test("Can get Passport Stream from a wallet address", async () => {
  const reader = new PassportReader();

  const mockGetGenesis = jest.fn();
  mockGetGenesis.mockReturnValueOnce({
    did: "",
    streams: {
      [reader._ceramic_gitcoin_passport_stream_id]: "test",
    }
  });

  reader._tulons.getStream = jest.fn();
  reader._tulons.getGenesis = mockGetGenesis;

  await reader.getPassportStream("0x0");

  expect(reader._tulons.getGenesis).toBeCalledWith("0x0", [
    reader._ceramic_gitcoin_passport_stream_id,
  ]);
  expect(reader._tulons.getStream).toBeCalledWith("test");
});

test("Can get Passport from a wallet address and hydrate all Stamps from ceramic:// links", async () => {
  const reader = new PassportReader();

  const mockGetGenesis = jest.fn();
  mockGetGenesis.mockReturnValueOnce({
    did: "",
    streams: {
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

  const passport = await reader.getPassport("0x0");

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
