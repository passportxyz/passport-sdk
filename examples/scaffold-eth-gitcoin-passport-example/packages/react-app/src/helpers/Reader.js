import { Tulons } from "tulons";

export async function getGenesis(address, url, network) {
  let genesis;
  const _tulons = new Tulons(url, network);
  try {
    genesis = await _tulons.getGenesis(address);
  } catch {
    genesis = false;
  }
  return genesis;
}

export async function getPassportStream(address, streams, url, network) {
  let passport;
  const _ceramic_gitcoin_passport_stream_id =
    process.env._ceramic_gitcoin_passport_stream_id ||
    "kjzl6cwe1jw148h1e14jb5fkf55xmqhmyorp29r9cq356c7ou74ulowf8czjlzs";
  const _tulons = new Tulons(url, network);

  try {
    // pull pointer from did to passport stream
    streams =
      streams && streams[_ceramic_gitcoin_passport_stream_id]
        ? streams
        : // get the genesis link and pull streams from it
          (await _tulons.getGenesis(address, [_ceramic_gitcoin_passport_stream_id])).streams;
    // pull the passport from the discovered stream
    passport = await _tulons.getStream(streams[_ceramic_gitcoin_passport_stream_id]);
  } catch {
    passport = false;
  }

  return passport;
}
