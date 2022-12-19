// --- Typings for Passport
import { Passport, Stamp, VerifiableCredential } from "../../types";

// -- Ceramic and Glazed
import type { CeramicApi } from "@ceramicnetwork/common";
import { CeramicClient } from "@ceramicnetwork/http-client";
import publishedModel from "../../schemas/models";
import { DataModel } from "@glazed/datamodel";
import { DIDDataStore } from "@glazed/did-datastore";
import { TileLoader } from "@glazed/tile-loader";
import type { DID as CeramicDID } from "dids";
import axios from "axios";

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

// const LOCAL_CERAMIC_CLIENT_URL = "http://localhost:7007";
const COMMUNITY_TESTNET_CERAMIC_CLIENT_URL =
  "https://ceramic-clay.3boxlabs.com";

export type ModelTypes = {
  schemas: {
    Passport: CeramicPassport;
    VerifiableCredential: VerifiableCredential;
  };
  definitions: {
    Passport: "Passport";
    VerifiableCredential: "VerifiableCredential";
  };
  tiles: Record<string, never>;
};

// --- Define PassportReader class (Returns Passport data via Tulons)
export class PassportReader {
  did: string;
  loader: TileLoader;
  ceramicClient: CeramicApi;
  model: DataModel<ModelTypes>;
  store: DIDDataStore<ModelTypes>;
  apiHost: string;

  constructor(did?: CeramicDID, ceramicHost?: string, aliases?: any) {
    // this._ceramic_gitcoin_passport_stream_id =
    //   "kjzl6cwe1jw148h1e14jb5fkf55xmqhmyorp29r9cq356c7ou74ulowf8czjlzs";

    // Create the Ceramic instance and inject the DID
    this.apiHost = ceramicHost ?? COMMUNITY_TESTNET_CERAMIC_CLIENT_URL;
    const ceramic = new CeramicClient(this.apiHost);
    ceramic.setDID(did);

    // Create the loader, model and store
    const loader = new TileLoader({ ceramic });
    const model = new DataModel({
      ceramic,
      aliases: aliases ?? publishedModel,
    });
    const store = new DIDDataStore({ loader, ceramic, model });

    // Store the users did:pkh here to verify match on credential
    this.did = (did.hasParent ? did.parent : did.id).toLowerCase();

    // Store state into class
    this.loader = loader;
    this.ceramicClient = ceramic;
    this.model = model;
    this.store = store;
  }

  // async getGenesis(address: string): Promise<CeramicGenesis | false> {
  //   let genesis: CeramicGenesis | false;

  //   // attempt to get the associated genesis for the given account
  //   try {
  //     genesis = await this._tulons.getGenesis(address);
  //   } catch {
  //     genesis = false;
  //   }

  //   return genesis;
  // }

  async getPassport(): Promise<Passport | undefined | false> {
    try {
      const passport = await this.store.get("Passport");
      if (!passport) return false;

      // According to the logs, it does happen that passport is sometimes an empty object {}
      // We treat this case as an non-existent passport
      if (!passport.stamps) return false;

      const streamIDs: string[] = passport?.stamps.map(
        (ceramicStamp: CeramicStamp) => {
          return ceramicStamp.credential;
        }
      );

      // `stamps` is stored as ceramic URLs - must load actual VC data from URL
      const stampsToLoad = passport?.stamps.map(async (_stamp, idx) => {
        const streamUrl = `${this.apiHost}/api/v0/streams/${streamIDs[
          idx
        ].substring(10)}`;

        try {
          const { provider, credential } = _stamp;
          const loadedCred = await axios.get(streamUrl);
          return {
            provider,
            //TODO: remove or create types for data content
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            credential: loadedCred.data.state.content,
            streamId: streamIDs[idx],
          } as Stamp;
        } catch (e) {
          console.error(
            `Error when loading stamp with streamId ${
              streamIDs[idx]
            } for did  ${this.did}: ${JSON.stringify(e)}`
          );
          throw e;
        }
      });

      // Wait for all stamp loading to be settled
      const stampLoadingStatus = await Promise.allSettled(stampsToLoad);

      // Filter out only the successfully loaded stamps
      const isFulfilled = <T>(
        input: PromiseSettledResult<T>
      ): input is PromiseFulfilledResult<T> => input.status === "fulfilled";
      const filteredStamps = stampLoadingStatus.filter(isFulfilled);
      const loadedStamps = filteredStamps.map(
        (settledStamp) => settledStamp.value
      );

      const parsePassport: Passport = {
        issuanceDate: new Date(passport.issuanceDate),
        expiryDate: new Date(passport.expiryDate),
        stamps: loadedStamps,
      };

      // try pinning passport
      try {
        const passportDoc = await this.store.getRecordDocument(
          this.model.getDefinitionID("Passport")
        );
        await this.ceramicClient.pin.add(passportDoc.id);
      } catch (e) {
        console.error(
          `Error when pinning passport for did  ${this.did}: ${JSON.stringify(
            e
          )}`
        );
      }

      return parsePassport;
    } catch (e) {
      console.error(
        `Error when loading passport for did  ${this.did}: ${JSON.stringify(e)}`
      );
      return undefined;
    }
  }

  // async getPassportStream(
  //   address: string,
  //   streams?: CeramicStreams
  // ): Promise<CeramicPassport | false> {
  //   let passport: CeramicPassport | false;

  //   try {
  //     // pull pointer from did to passport stream
  //     streams =
  //       streams && streams[this._ceramic_gitcoin_passport_stream_id]
  //         ? streams
  //         : // get the genesis link and pull streams from it
  //           (
  //             await this._tulons.getGenesis(address, [
  //               this._ceramic_gitcoin_passport_stream_id,
  //             ])
  //           ).streams;
  //     // pull the passport from the discovered stream
  //     passport = (await this._tulons.getStream(
  //       streams[this._ceramic_gitcoin_passport_stream_id] as string
  //     )) as CeramicPassport;
  //   } catch {
  //     passport = false;
  //   }

  //   return passport;
  // }
}
