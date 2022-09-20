import React from "react";
import GitcoinLogo from "../assets/GitcoinLogoWhite.svg";
import { usePassport } from "../hooks/usePassport";

// This component facilitates interaction with the GitCoin Passport,
// including reading, verifying, and scorind functionality
export default function SigninPassport({ address, approvalThreshold, acceptedStamps }) {
  const passport = usePassport();

  return (
    <div className="p-10">
      <div className="border-2 pb-28 border-solid border-gray-600 mx-auto w-3/4 bg-blue-darkblue text-white p-10">
        <h2 className="text-white text-xl">Sign in with Passport</h2>
        <div className="mt-10 mb-4 flex items-center font-medium text-gray-900 md:mb-0">
          <img src={GitcoinLogo} alt="Gitcoin Logo White" />
          <span className="font-miriam-libre ml-3 text-4xl text-white">Passport</span>
        </div>
        <div className="mt-4 mb-4">
          <button
            data-testid="connectWalletButton"
            className="rounded-sm rounded bg-purple-connectPurple py-2 px-10 text-white"
            onClick={() =>
              passport.active
                ? passport.disconnect()
                : passport.activate({
                    mode: "read",
                    address,
                  })
            }
          >
            {passport.active ? "Disconnect" : `Read${passport.pending === "read" ? "ing..." : ""}`}
          </button>
          <br />
          <button
            data-testid="verifyPassportButton"
            className="rounded-sm rounded bg-purple-connectPurple py-2 px-10 text-white mt-4"
            onClick={() =>
              passport.activate({
                mode: "verify",
                address,
              })
            }
          >
            {passport.verified && "Re-"}
            Verify
            {passport.pending === "verify" && "ing..."}
          </button>
          <br />
          <button
            data-testid="scorePassportButton"
            className="rounded-sm rounded bg-purple-connectPurple py-2 px-10 text-white mt-4"
            onClick={() =>
              passport.activate({
                mode: "score",
                address,
                acceptedStamps,
                approvalThreshold,
              })
            }
          >
            {passport.scored && "Re-"}
            Scor
            {passport.pending === "score" ? "ing..." : "e"}
          </button>
        </div>

        {(passport.active || passport.error) && (
          <div className="border-2 p-10 mt-10">
            <h1 className="text-white text-3xl mb-4">
              Passport {passport.active ? "Data" : "Error"}
              {passport.verified && " ✅"}
              {passport.approved && " 🌟"}
              {passport.error && " ❌"}
            </h1>
            {passport.error}
            {passport.missing && (
              <p>
                To create a Gitcoin Passport, go{" "}
                <a target="_blank" rel="noreferrer" href="https://passport.gitcoin.co/">
                  here
                </a>
              </p>
            )}
            {passport.active && (
              <>
                <p className="font-bold">Verified: {passport.verified ? "✅" : "❌"}</p>
                {passport.scored && (
                  <>
                    <p className="font-bold">Score: {passport.score}</p>
                    <p className="font-bold">Approved: {passport.approved ? "🌟" : "❌"}</p>
                    {!passport.issuanceDate && (
                      <div className="max-w-lg">
                        Scoring alone does not load passport metadata locally.
                        <br />
                        Click Re-Verify to fetch additional data
                      </div>
                    )}
                  </>
                )}
                {passport.expiryDate && <p>Expiry Date: {passport.expiryDate}</p>}
                {passport.issuanceDate && <p>Issuance Date: {passport.issuanceDate}</p>}

                {passport.stamps?.length > 0 && (
                  <div>
                    Stamps:
                    <ul className="list-disc ml-10">
                      {passport.stamps.map(item => (
                        <li key={item.provider} className="text-white">
                          {item.provider}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
