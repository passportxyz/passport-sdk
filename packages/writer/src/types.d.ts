import { VerifiableCredential } from "@gitcoinco/passport-sdk-types";
import { Passport, Stamp, DID } from "@gitcoinco/passport-sdk-types";

export type CeramicStreamId = string;

export type CeramicStamp = {
  provider: string;
  credential: string;
};
export type CeramicPassport = {
  issuanceDate: string;
  expiryDate: string;
  stamps: CeramicStamp[];
};

export type ModelDefinition = {
  schemas: {
    Passport: string;
    VerifiableCredential: string;
  };
  definitions: {
    Passport: string;
    VerifiableCredential: string;
  };
  tiles: {
    [key: string]: string;
  };
};

export type ModelTypes = {
  schemas: {
    Passport: CeramicPassport;
    VerifiableCredential: VerifiableCredential;
  };
  definitions: {
    Passport: "Passport";
    VerifiableCredential: "VerifiableCredential";
  };
  tiles: Record<string, string>;
};

export type Logger = {
  error: (msg: string, context?: object) => void;
  log: (msg: string, context?: object) => void;
  warn: (msg: string, context?: object) => void;
  debug: (msg: string, context?: object) => void;
  info: (msg: string, context?: object) => void;
};

// Class used as a base for each DataStorage Type
// Implementations should enforce 1 Passport <-> 1 user
//  and it is assumed which Passport/user to act on when
//  calling createPassport, getPassport, addStamp
export abstract class DataStorageBase {
  abstract createPassport(): Promise<DID>;
  abstract getPassport(): Promise<Passport | undefined | false>;
  abstract addStamp(stamp: Stamp): Promise<void>;
}
