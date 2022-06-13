// ---- Tulons exposes a simple interface to read from Ceramic
import { CeramicGenesis, Tulons } from "tulons";

// ---- Define Typings for dPassport
export type CeramicStreams = Record<string, string | false>;

// Raw Stamp stream as pulled from Ceramic
export type CeramicStampStream = {
  provider: string;
  credential: string;
};
// Hydrated Stamp stream
export type CeramicStampRecord = {
  provider: string;
  credential: VerifiableCredential;
};

// Raw Passport stream as pulled from Ceramic
export type CeramicPassportStream = {
  issuanceDate: string;
  expiryDate: string;
  stamps: CeramicStampStream[];
};
// Hydrated Passport stream
export type CeramicPassportRecord = {
  issuanceDate: string;
  expiryDate: string;
  stamps: CeramicStampRecord[];
};

// Each Stamp holds a VerifiableCredential that describes the authentication method being attested to
export type VerifiableCredential = {
  "@context": string[];
  type: string[];
  credentialSubject: {
    id: string;
    "@context": { [key: string]: string }[];
    hash?: string;
    provider?: string;
    address?: string;
    challenge?: string;
  };
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  proof: {
    type: string;
    proofPurpose: string;
    verificationMethod: string;
    created: string;
    jws: string;
  };
};

// ---- Define PassportReader class (Returns Passport/Account data via Tulons)
export class PassportReader {
  _tulons: Tulons;

  _ceramic_gitcoin_passport_stream_id: string;

  constructor(url?: string, network?: string | number) {
    // create a tulons instance
    this._tulons = new Tulons(url, network);
    // ceramic definition keys to get streamIds from genesis record
    this._ceramic_gitcoin_passport_stream_id =
      "kjzl6cwe1jw148h1e14jb5fkf55xmqhmyorp29r9cq356c7ou74ulowf8czjlzs";
  }

  async getGenesis(address: string): Promise<CeramicGenesis | false> {
    let genesis: CeramicGenesis | false;

    // attempt to get the associated genesis for the given account
    try {
      genesis = await this._tulons.getGenesis(address);
    } catch {
      genesis = false;
    }

    return genesis;
  }

  async getPassport(
    address: string,
    streams?: CeramicStreams
  ): Promise<CeramicPassportStream | CeramicPassportRecord | false> {
    const passport = await this.getPassportStream(address, streams);

    // hydrate the ceramic:// uris in the passport
    if (passport) {
      return (await this._tulons.getHydrated(
        passport
      )) as CeramicPassportRecord;
    }

    return passport;
  }

  async getPassportStream(
    address: string,
    streams?: CeramicStreams
  ): Promise<CeramicPassportStream | false> {
    let passport: CeramicPassportStream | false;

    try {
      // pull pointer from did to passport stream
      streams =
        streams && streams[this._ceramic_gitcoin_passport_stream_id]
          ? streams
          : // get the genesis link and pull streams from it
            (
              await this._tulons.getGenesis(address, [
                this._ceramic_gitcoin_passport_stream_id,
              ])
            ).streams;
      // pull the passport from the discovered stream
      passport = (await this._tulons.getStream(
        streams[this._ceramic_gitcoin_passport_stream_id] as string
      )) as CeramicPassportStream;
    } catch {
      passport = false;
    }

    return passport;
  }
}
