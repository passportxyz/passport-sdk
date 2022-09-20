import React, { useCallback, useContext, useReducer } from "react";

import { PassportReader } from "@gitcoinco/passport-sdk-reader";

/*
 *
 * This module provices access to a
 * PassportProvider which should be instantiated
 * at the top of the app, as well as a
 * usePassport hook which provides access
 * to methods for reading, verifying, and
 * scoring a passport
 *
 * See below for more info on usage
 * Explore Passport SDKs on npm
 * https://github.com/gitcoinco/passport-sdk
 * @gitcoinco/passport-sdk-reader
 * @gitcoinco/passport-sdk-scorer
 * @gitcoinco/passport-sdk-verifier
 * @gitcoinco/passport-sdk-writer
 */

const Passport = React.createContext({});

const PROD_GITCOIN_CERAMIC_NODE_URL = "https://ceramic.passport-iam.gitcoin.co";
const MAINNET_NETWORK_ID = "1";

const ceramic_url = process.env.REACT_APP_CERAMIC_URL || PROD_GITCOIN_CERAMIC_NODE_URL;
const passport_network_id = process.env.REACT_APP_PASSPORT_NETWORK_ID || MAINNET_NETWORK_ID;

// This object and set of functions allow
// for consistent state management
const defaults = {
  // True when successfully connected
  active: false,
  // String read|verify|score when loading
  // null otherwise
  pending: null,
  // True after successful verification/scoring
  verified: false,
  // Calculated score
  score: 0,
  // True after successful scoring
  scored: false,
  // True if score is greater than threshold
  approved: false,
  // String error message on error, null otherwise
  error: null,
  // True if passport is missing for this address
  missing: false,
};

function resetPassport() {
  return defaults;
}

function setPassport(data) {
  return { ...defaults, ...data, misssing: null, error: null };
}

function errorPassport(message, extraData) {
  console.log("usePassport error:", message, extraData);
  if (extraData) console.log(extraData);
  return { ...defaults, ...(extraData || {}), error: message };
}

// This is the central reducer for passport state
function updatePassport(state, action) {
  const { type, data } = action;

  switch (type) {
    case "reset":
      return resetPassport();
    case "activate":
      return setPassport({ ...state, ...data, pending: null, active: true });
    case "pending":
      return setPassport({ ...state, pending: data });
    case "missing":
      return errorPassport(data, { missing: true });
    case "error":
      return errorPassport(data);
    default:
      return errorPassport("Invalid passport update");
  }
}

//
// Main logic for the passport
// Intended to be used internally by the context,
// but can certainly be called directly to use
// outside of the context
//
// Usage documented with usePassport below
//
function usePassportManager() {
  // Manages passport state
  const [passport, dispatch] = useReducer(updatePassport, undefined, resetPassport);

  const reportMissingPassport = () =>
    dispatch({ type: "missing", data: "Unable to retrieve passport, you may need to create one" });

  const read = useCallback(async address => {
    // Create PassportReader with given URL and Network
    const reader = new PassportReader(ceramic_url, passport_network_id);

    // Load passport for this address
    // Returns (e.g.):
    // {
    //   issuanceDate: '2022-08-03T22:30:15.042Z'
    //   expiryDate: '2022-08-03T22:30:15.042Z',
    //   stamps: [{
    //     credential: {},
    //     provider: "Twitter",
    //   }]
    // }
    const data = await reader.getPassport(address);

    // If data is false, the passport was missing
    if (!data) return reportMissingPassport();

    console.log("Passport Data", data);
    dispatch({ type: "activate", data });

    return true;
  }, []);

  // These 2 modules (verifier and scorer) must be
  // dynamically loaded. Required for WASM
  const loadVerifier = useCallback(async () => {
    const PassportVerifier = (await import("@gitcoinco/passport-sdk-verifier")).PassportVerifier;
    // Create PassportVerifier with given URL and Network
    return new PassportVerifier(ceramic_url, passport_network_id);
  }, []);

  const loadScorer = useCallback(async stamps => {
    const PassportScorer = (await import("@gitcoinco/passport-sdk-scorer")).PassportScorer;
    // Create PassportScorer with given stamp criteria, URL, and Network
    return new PassportScorer(stamps, ceramic_url, passport_network_id);
  }, []);

  const verify = useCallback(
    async address => {
      const verifier = await loadVerifier();

      // Verify passport for the given addresss
      // Returns (e.g.):
      // {
      //   issuanceDate: '2022-08-03T22:30:15.042Z'
      //   expiryDate: '2022-08-03T22:30:15.042Z',
      //   stamps: [{
      //     credential: {},
      //     provider: "Twitter",
      //     verified: true,
      //   }]
      // }
      const data = await verifier.verifyPassport(address);
      console.log("verify data", data);

      // If data is false, the passport was missing
      if (!data) return reportMissingPassport();

      // Any failed stamp will have false for the .verified prop
      const failedStamps = data.stamps.filter(stamp => !stamp.verified);

      if (failedStamps.length)
        return dispatch({
          type: "error",
          data: "Failed to verify stamp(s): " + JSON.stringify(failedStamps),
        });
      else dispatch({ type: "activate", data: { verified: "true", ...data } });
    },
    [loadVerifier],
  );

  const score = useCallback(
    async (address, acceptedStamps, approvalThreshold) => {
      // Ensure proper parameters passed in
      if (!approvalThreshold || !(acceptedStamps && acceptedStamps.length))
        return dispatch({
          type: "error",
          data: "Passport scoring requires non-zero approvalThreshold and an array of stamps in format [{provider, issuer, score}]",
        });

      const scorer = await loadScorer(acceptedStamps);

      // Calculate score for the given address, based on
      // the criteria provided when creating the PassportScorer
      // Returns only the calculated score
      const score = await scorer.getScore(address);

      const approved = score >= approvalThreshold;

      // If already verified, or if score > 0,
      // then we know this is verified
      const verified = passport.verified || score > 0;

      dispatch({
        type: "activate",
        data: { scored: true, score, approved, verified },
      });

      return approved;
    },
    [loadScorer, passport.verified],
  );

  const setPendingStatus = useCallback(status => dispatch({ type: "pending", data: status }), []);

  // This is the main function used to interact with the Passport
  // Usage documented below with usePassport
  const activate = useCallback(
    async ({ address, mode, acceptedStamps, approvalThreshold }) => {
      if (!address) return dispatch({ type: "error", data: "Address required to interact with a passport" });

      let approved = false;
      switch (mode) {
        case "read":
          setPendingStatus("read");
          await read(address);
          break;
        case "verify":
          setPendingStatus("verify");
          await verify(address);
          break;
        case "score":
        default:
          setPendingStatus("score");
          approved = await score(address, acceptedStamps, approvalThreshold);
          break;
      }

      return approved;
    },
    [read, verify, score, setPendingStatus],
  );

  const disconnect = useCallback(() => dispatch({ type: "reset" }), []);

  return { activate, disconnect, ...passport };
}

//
// Usage:
// Place this at the root of your app to make a single
// Passport available across your app with usePassport
//
// Example:
// function App(props){
//   ...
//   return (
//     <PassportProvider>
//       ...
//     </PassportProvider>
//   );
// }
//
function PassportProvider({ children }) {
  const value = usePassportManager();

  return <Passport.Provider value={value}>{children}</Passport.Provider>;
}

//
// Usage:
// Use this hook wherever you want to access a user's GitCoin Passport
// The same hook can be used to load a passport or check properties
// including a calculated personhood score
// After scoring, simply check passport.approved to see if a user's
// personhood score met the required threshold
//
// Example (sign in and score):
//  function SignInPassport(props){
//    const { activate } = usePassport();
//
//    return (
//      ...
//      <button onclick={ () =>
//        passport.activate({
//          mode: "score",
//          address: {props.address},
//          acceptedStamps: [
//            {
//              provider: "Github",
//              score: 0.5,
//              // Note: this is the production Gitcoin Passport issuer DID
//              issuer: "did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC",
//            },
//            {
//              provider: "Twitter",
//              score: 0.5,
//              issuer: "did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC",
//            },
//            {
//              provider: "Google",
//              score: 0.5,
//              issuer: "did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC",
//            },
//          ],
//          // User will be approved at or above this score
//          approvalThreshold: {1},
//        })
//      }>
//        Sign In
//      </button>
//    )
//  }
//
// Example (check if approved, after scoring elsewhere):
//  function ApprovedOnlyFeature(props){
//    const { approved } = usePassport();
//
//    return (
//      { approved && <MyApprovedOnlyComponent /> }
//    )
//  }
//
// Complete Functionality
//  const {
//    // Attributes
//    // See defaults above for an
//    // explanation of functionality
//    active,
//    pending,
//    verified,
//    score,
//    scored,
//    approved,
//    error,
//    missing,
//    // Methods - Examples Follow
//    activate,
//    disconnect,
//  }
//
//  // 🠗 Activate Usage 🠗
//
//  // Read unverified Passport data for the given ethereum address
//  activate({
//    mode: "read",
//    address: "0x123sadf123",
//  });
//
//  // Read verified Passport data for the given ethereum address
//  activate({
//    mode: "verify",
//    address: "0x123sadf123",
//  });
//
//  // Score example is shown above.
//
//  // Disconnecting
//  disconnect();
//
const usePassport = () => useContext(Passport);

export { PassportProvider, usePassport, usePassportManager };
