// --- Passport SDK Packages
import { PassportReader } from "@gitcoinco/passport-sdk-reader";
import { PassportVerifier } from "@gitcoinco/passport-sdk-verifier";

// --- Types
import { Passport, Stamp } from "@gitcoinco/passport-sdk-types";

export type Criteria = {
  provider: string;
  issuer: string;
  score: number;
};

// --- PassportScorer - Read and score a Passport
export class PassportScorer {
  _reader: PassportReader;
  _verifier: PassportVerifier;
  _criteria: Criteria[];

  constructor(criteria: Criteria[], url = "https://ceramic.passport-iam.gitcoin.co", network = "1") {
    // attach an instance of the reader
    this._reader = new PassportReader(url, network);
    // attach an instance of the verifier
    this._verifier = new PassportVerifier(url, network);
    // store the scoring criteria
    this._criteria = criteria;
  }

  async getScore(
    address: string,
    passport?: Passport,
    additionalStampChecks?: (stamp: Stamp) => boolean
  ): Promise<number> {
    // get the passport
    const passportRecord = (passport || (await this._reader.getPassport(address))) as Passport;
    // get the passport with .verified state on the stamps
    const passportVerified = await this._verifier.verifyPassport(address, passportRecord, additionalStampChecks);

    // when passport exists - score the stamps
    if (passportVerified) {
      // Index the stamps by issuer and provider
      const indexedStamps = passportVerified.stamps.reduce((stamps, stamp) => {
        stamps[`${stamp.credential.issuer}:${stamp.credential.credentialSubject.provider}`] = stamp;

        return stamps;
      }, {});

      // extract the score for each of our recognised stamps (in the criteria)
      const scores = this._criteria.map((criteria) => {
        const stamp = indexedStamps[`${criteria.issuer}:${criteria.provider}`] as Stamp;

        // given the stamp exists...
        if (stamp) {
          return stamp.verified ? criteria.score : 0;
        }

        return 0;
      });

      // reduce the scores to a single cumalative score
      return scores.reduce((score: number, stampScore: number) => {
        return score + stampScore;
      }, 0);
    } else {
      return 0;
    }
  }
}
