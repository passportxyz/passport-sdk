// --- Tulons exposes a simple interface to read from Ceramic
import { CeramicGenesis, Tulons } from "tulons";

// --- Typings for Passport
import { Passport } from "../../types/src";

// --- Typings for raw Ceramic content
export type CeramicStreams = Record<string, string | false>;
export type CeramicStamp = {
  provider: string;
  credential: string;
};
export type CeramicPassport = {
  issuanceDate: string;
  expiryDate: string;
  stamps: CeramicStamp[];
};

// --- Define PassportReader class (Returns Passport data via Tulons)
export class PassportReader {
  _tulons: Tulons;

  _ceramic_gitcoin_passport_stream_id: string;

  constructor(url = "https://ceramic.passport-iam.gitcoin.co", network = "1") {
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
  ): Promise<CeramicPassport | Passport | false> {
    const passport = await this.getPassportStream(address, streams);

    // hydrate the ceramic:// uris in the passport
    if (passport) {
      return (await this._tulons.getHydrated(passport)) as Passport;
    }

    return passport;
  }

  async getPassportStream(
    address: string,
    streams?: CeramicStreams
  ): Promise<CeramicPassport | false> {
    let passport: CeramicPassport | false;

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
      )) as CeramicPassport;
    } catch {
      passport = false;
    }

    return passport;
  }
}
