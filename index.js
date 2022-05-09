var fetch = require("node-fetch");
var csv = require("csvtojson");
const fs = require("fs");
request = require("request");
const converter = require("json-2-csv");

const inFile = "Spela_14.csv";
const outfile = "Spela_14_mp3s.csv";

async function go() {
  const csvFilePath = inFile; //file path of csv
  const json = await csv().fromFile(csvFilePath);
  // console.log(json);
  await asyncForEach(json, async (j) => {
    if (j.URL && j.URL.startsWith("https://podcasts.apple.com")) {
      await parseApple(j.URL);
    }
  });
  converter.json2csv(out, (err, csv) => {
    if (err) console.log("ERR", err);
    fs.writeFileSync(outfile, csv);
  });
  // parseApple(json[0].URL);
}
go();

function alreadyDownloaded(name) {
  const contents = fs.readdirSync("out");
  return contents.includes(name + ".mp3");
}

const cache = {};

const out = [];

async function parseApple(url) {
  if (cache[url]) return;
  cache[url] = true;
  try {
    const slashIdx = url.lastIndexOf("/");
    const last = url.slice(slashIdx + 1);
    const arr = last.split("?");
    const id = arr[0].substring(2);
    const epid = arr[1].substring(2);
    var url = `https://itunes.apple.com/lookup?id=${id}&country=US&media=podcast&entity=podcastEpisode&limit=100`;
    var r = await fetch(url);
    var j = await r.json();
    const episode = j.results.find((ep) => {
      return ep.trackId + "" == epid;
    });
    if (!episode) return;
    out.push({
      name: episode.trackName,
      mp3: episode.episodeUrl,
    });
    // const name = episode.trackName.replaceAll(" ", "_");
    // if (alreadyDownloaded(name)) {
    //   return;
    // }
    // await dlFile(episode.episodeUrl, name);
  } catch (e) {
    console.log(e);
  }
}

function outName(name) {
  return "out/" + name + ".mp3";
}

async function dlFile(path, name) {
  console.log("DOWNLOAd", name);
  request
    .get(path)
    .on("error", function (err) {
      console.log("download err", err);
    })
    .pipe(fs.createWriteStream(outName(name)));
  await sleep(2000);
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
