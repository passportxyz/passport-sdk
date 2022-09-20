import React, { useState } from "react";
import { Button, Input } from "antd";
import GitcoinLogo from "../assets/GitcoinLogoWhite.svg";

// This module allows the user to configure passport scoring
// This would never be used in production, but instead is
// here to provide the user a chance to learn about and
// experiment with Gitcoin Passport scoring
export default function ConfigurePassportScoring({
  approvalThreshold,
  acceptedStamps,
  setApprovalThreshold,
  setAcceptedStamps,
  issuer,
}) {
  const [newApprovalThreshold, setNewApprovalThreshold] = useState(approvalThreshold);
  const [newProvider, setNewProvider] = useState("");
  const [newScore, setNewScore] = useState("");

  const clearNewEntry = () => {
    setNewScore("");
    setNewProvider("");
  };

  return (
    <div className="p-10">
      <div className="border-2 pb-28 border-solid border-gray-600 mx-auto w-3/4 bg-blue-darkblue text-white p-10">
        <h2 className="text-white text-xl">Configure Passport Scoring</h2>
        <div className="mt-10 mb-4 flex items-center font-medium text-gray-900 md:mb-0">
          <img src={GitcoinLogo} alt="Gitcoin Logo White" />
          <span className="font-miriam-libre ml-3 text-4xl text-white">Settings</span>
        </div>
        <div className="mt-4 mb-4">
          <h4 className="text-white text-lg">Approval Threshold: {approvalThreshold}</h4>
          <div className="text-sm text-white mx-2">Threshold of total stamp score at which user is approved</div>
          <div className="m-2 max-w-xs">
            <Input onChange={e => setNewApprovalThreshold(e.target.value)} value={newApprovalThreshold} />
            <Button className="mt-2" onClick={() => setApprovalThreshold(parseFloat(newApprovalThreshold))}>
              Set
            </Button>
          </div>
        </div>
        <div className="mt-4 mb-4">
          <h4 className="text-white text-lg">Accepted Stamps</h4>
          <div className="max-w-lg">
            <div className="text-sm text-white mx-2">Score for each accepted stamp</div>
            <div className="text-xs text-white mx-2">
              Add more (or override) below, or clear the map and start over.
            </div>
          </div>
          <div className="m-2 max-w-md">
            {!!acceptedStamps.length && (
              <table>
                <tbody>
                  {acceptedStamps.map(({ provider, score }) => (
                    <tr key={provider}>
                      <td>Provider: {provider}</td>
                      <td className="pl-6">Score: {score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <h5 className="text-white mt-4">Add New Provider Score</h5>
            <div className="flex flex-row">
              <div className="pr-2 flex flex-row flex-nowrap">Provider:</div>
              <Input onChange={e => setNewProvider(e.target.value)} value={newProvider} />
            </div>
            <div className="flex flex-row mt-2">
              <div className="pr-2 flex flex-row flex-nowrap">Score:</div>
              <Input onChange={e => setNewScore(e.target.value)} value={newScore} />
            </div>
            <Button
              style={{ marginTop: 8 }}
              onClick={() => {
                setAcceptedStamps(acceptedStamps => {
                  const newStamp = {
                    provider: newProvider,
                    score: parseFloat(newScore),
                    issuer,
                  };

                  const index = acceptedStamps.findIndex(({ provider }) => provider === newProvider);

                  if (index >= 0) acceptedStamps[index] = newStamp;
                  else acceptedStamps.push(newStamp);

                  return acceptedStamps;
                });

                clearNewEntry();
              }}
            >
              Add New
            </Button>
            <br />
            <Button
              style={{ marginTop: 8 }}
              onClick={() => {
                setAcceptedStamps([]);
                clearNewEntry();
              }}
            >
              Clear Map
            </Button>
            <div className="text-xs text-white mx-2 mt-4 max-w-lg">
              Note: By default, the production Gitcoin Passport issuer is used. To override, deploy this dapp locally
              and set REACT_APP_ISSUER_DID in the environment. REACT_APP_CERAMIC_URL and REACT_APP_PASSPORT_NETWORK_ID
              can also be overridden. See .sample.env
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
