// @ts-ignore
import react, { useState } from "react";
// @ts-ignore
import logo from "./GitcoinLogo.svg";
import "./App.css";

// --- sdk import
import { PassportReader } from "@gitcoinco/passport-sdk-reader";

function App() {
  const [addressInput, setAddressInput] = useState("");
  const [passport, setPassport] = useState({});

  const reader = new PassportReader();

  const handleSubmit = (event) => {
    event.preventDefault();
    reader.getPassportStream(addressInput).then((result) => {
      setPassport(result);
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Passport Reader SDK</h1>
        <p>Enter Wallet Address to Output Passport Data</p>
        <form>
          <input
            type="text"
            name="inputAddress"
            style={{ padding: 12 }}
            // @ts-ignore
            onChange={(e) => setAddressInput(e.target.value)}
            value={addressInput}
          />
          <button style={{ padding: 12 }} onClick={handleSubmit}>
            Enter
          </button>
        </form>
        {passport && (
          <div style={{ padding: 10, marginTop: 10, fontSize: 14, textAlign: "left" }}>
            <h1 style={{ textAlign: "center" }}>Passport Data</h1>
            {
              // @ts-ignore
              passport?.expiryDate && (
                <p>
                  Expiry Date:{" "}
                  {
                    // @ts-ignore
                    passport?.expiryDate
                  }
                </p>
              )
            }
            {
              // @ts-ignore
              passport?.issuanceDate && (
                <p>
                  Issuance Date:{" "}
                  {
                    // @ts-ignore
                    passport?.issuanceDate
                  }
                </p>
              )
            }

            {
              // @ts-ignore
              passport?.stamps?.length > 0 && (
                <div>
                  Stamps:{" "}
                  <ul>
                    {
                      // @ts-ignore
                      passport?.stamps?.map((item, index) => {
                        return <li key={index}>{item.provider}</li>;
                      })
                    }
                  </ul>
                </div>
              )
            }
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
