# 🏗 Scaffold-ETH Gitcoin Passport

## About this Branch
This branch of [Scaffold-Eth](https://github.com/scaffold-eth/scaffold-eth) facilitates interaction with
[Gitcoin Passports](https://passport.gitcoin.co/) in your dapp.

In this package, the [Gitcoin Passport SDK](https://github.com/gitcoinco/passport-sdk) is wrapped with
React components to provide a simple dapp interface.

See Quick Start below if you want to get started using Gitcoin Passport in your dapp.

This package can also be used simply to learn about Passport scoring.

For your convenience, there is a hosted version [here](https://lucianhymer.github.io/Scaffold-eth-gitcoin-passport).

## Hosted Demo
This app is hosted in GitHub Pages and can be accessed [here](https://lucianhymer.github.io/Scaffold-eth-gitcoin-passport).
This is a great resource to see how passports and scoring work before cloning this repo to build your dapp.
Work with the passport on the first tab and configure scoring parameters on the second tab.

## Quick Start
After experimenting with the hosted demo, you can create your own app with Gitcoin Passport in a few simple steps: 
1. Clone this repo
2. Set your approvedStamps and approvalThreshold where SinginPassport is created in App.js
3. Call usePassport to check if the passport is approved wherever needed

Step 2: Setting stamps and threshold (line 313 in App.js)
```
<SigninPassport
  address={address}
  acceptedStamps={[
    {
      provider: "Github",
      score: 0.5,
      issuer: "did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC",
    },
    {
      provider: "Twitter",
      score: 0.5,
      issuer: "did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC",
    },
    {
      provider: "Google",
      score: 0.5,
      issuer: "did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC",
    }
  ]}
  approvalThreshold={1}
 />
```

Step 3: Checking approval
```
function ApprovedOnlyFeature(props){
  const { approved } = usePassport();

  return (
    { approved && <MyApprovedOnlyComponent /> }
  )
}
```

## Reading, Verifying, and Scoring Passports with usePassport

### Description
To interact with a Gitcoin Passport, first use the PassportProvider at the top level
```
import { PassportProvider } from "./hooks/usePassport";

function App(props){
  return (
    <PassportProvider>
      /* Your App code */
    </PassportProvider>
  );
}
```

Then call usePassport wherever you want to initiate sign-in or check approval
```
import { usePassport } from "../hooks/usePassport";

function MyComponent(props){
  const passport = usePassport();

  return (
    /* Your Code */
  );
}
```

The object returned by usePassport conforms to the following:
```
{
  activate: (
    address: string,
    // read|verify|score
    mode: string,
    // The following only for mode="score"
    acceptedStamps: [{
      provider: string,
      score: float,
      issuer: string
    }],
  ) => Promise<void>
  deactivate: () => void

  // True when successfully connected
  active: boolean,

  // String read|verify|score when loading, null otherwise
  pending: string | null,

  // True after successful verification/scoring
  verified: boolean,

  // Calculated score
  score: float,

  // True after successful scoring
  scored: boolean,

  // True if score is greater than threshold
  approved: boolean,

  // String error message on error, null otherwise
  error: string | null,

  // True if passport is missing for this address
  missing: boolean,
}
```

### Example
This example shown two components. The first is a button which triggers score calculation.
The second is a component which is only rendered when the user is approved.
```
function SignInPassportButton(props){
  const { activate } = usePassport();

  return (
    <button onclick={ () =>
      passport.activate({
        mode: "score",
        address: {props.address},
        acceptedStamps: [
          {
            provider: "Github",
            score: 0.5,
            // Note: this is the production Gitcoin Passport issuer DID
            issuer: "did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC",
          },
          {
            provider: "Twitter",
            score: 0.5,
            issuer: "did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC",
          },
          {
            provider: "Google",
            score: 0.5,
            issuer: "did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC",
          },
        ],
        // User will be approved at or above this score
        approvalThreshold: {1},
      })
    }>
      Sign In with Gitcoin Passport
    </button>
  )
}

function ApprovedOnlyFeature(props){
  const { approved } = usePassport();

  return (
    { approved && <MyApprovedOnlyComponent /> }
  )
}
```

## Scoring Mechanism
Scoring is based on the provided list of stamp criteria:
```
[{
  provider: string,
  issuer: string,
  score: float
}]
```
Provider is the name of a stamp provider, such as "Github" or "Twitter"

Issuer is the DID of the stamp issuer. The production Gitcoin Passport issuer DID is shown above.

Score is a number that you would customize. The total score returned by the getScore function will
be the total of all these individual "score"s for which the user has a verified stamp.

For example, take these stamps:
```
[{
  provider: "Github",
  score: 0.5,
  issuer: "did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC",
},
{
  provider: "Twitter",
  score: 0.5,
  issuer: "did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC",
},
{
  provider: "Google",
  score: 0.5,
  issuer: "did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC",
}]
```
If the user has a verified stamp for all three of these providers, their
score would be 1.5. If they had only two of these stamps, they'd have a score of 1.

The user will be approved if their score exceeds the specified approval level.

In the above example, if the approval threshold were 1 then the user would need at least
two stamps. If the threshold were 1.5, they'd need all three stamps.
