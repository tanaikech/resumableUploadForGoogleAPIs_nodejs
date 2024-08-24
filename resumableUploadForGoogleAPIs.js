/**
 * ### Description
 * Function for achieving the resumable upload with Google APIs.
 * You can achieve the resumable upload with various Google APIs by changing resumableUrl.
 *
 * @param {object} object - Object for running this function.
 * @param {string} object.filePath - File path of the file for uploading.
 * @param {string} object.fileUrl - File URL of the file for uploading.
 * @param {string} object.resumableUrl - URL for running the resumable upload.
 * @param {number} object.dataSize - Data size (content size, file size) of the file.
 * @param {string} object.accessToken - Access token for uploading with Google API you want to use.
 * @param {string} [object.metadata={}] - Metadata for Google API.
 * @param {number} [object.chunkSize=16777216] - The default chunk size is 16 MB (16,777,216 bytes). This is used as the chunk size for the resumable upload. This is 10 MB as a sample. In this case, please set the multiples of 256 KB (256 x 1024 bytes)
 *
 * @return {object}
 */
function resumableUpload(object) {
  const fs = require("fs");
  const stream = require("stream");

  const {
    filePath = "",
    fileUrl = "",
    resumableUrl = "",
    dataSize = 0,
    accessToken,
    metadata = {},
    chunkSize = 16777216,
  } = object;
  return new Promise(async (resolve, reject) => {
    let mainData;
    if (resumableUrl == "" || dataSize == 0) {
      throw new Error("Please set resumableUrl and dataSize");
    }

    // Retrieve data from file or url as steam.
    if (filePath != "" && fileUrl == "") {
      mainData = fs.createReadStream(filePath);
    } else if (filePath == "" && fileUrl != "") {
      const res1 = await fetch(fileUrl);
      mainData = new stream.Readable.fromWeb(res1.body);
    } else {
      throw new Error("Please set filePath or fileUrl");
    }
    const streamTrans = new stream.Transform({
      transform: function (chunk, _, callback) {
        callback(null, chunk);
      },
    });
    mainData.pipe(streamTrans);

    // Retrieve session for resumable upload.
    const headers = { "Content-Type": "application/json" };
    if (accessToken) {
      headers.authorization = `Bearer ${accessToken}`;
    }
    const res2 = await fetch(resumableUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(metadata),
    });
    let location = "";
    if (res2.ok) {
      location = res2.headers.get("location");
      console.log("The location URL could be obtained.");
    } else {
      reject({ status: res2.status, error: await res2.json() });
      return;
    }

    // Upload the file.
    let startByte = 0;
    let bufferData = [];
    streamTrans.on("data", async (chunk) => {
      bufferData.push(chunk);
      const temp = Buffer.concat(bufferData);
      if (temp.length >= chunkSize) {
        const dataChunk = temp.slice(0, chunkSize);
        const left = temp.slice(chunkSize);
        streamTrans.pause();
        let upCount = 0;

        const upload = async () => {
          console.log(
            `Progress: from ${startByte} to ${
              startByte + dataChunk.length - 1
            } for ${dataSize}`
          );
          const res3 = await fetch(location, {
            method: "PUT",
            headers: {
              "Content-Range": `bytes ${startByte}-${
                startByte + dataChunk.length - 1
              }/${dataSize}`,
            },
            body: dataChunk,
          });
          const text = await res3.text();
          // console.log({ ok: res3.ok, status: res3.status, body: text }); // For debug
          if (res3.ok && res3.status == 200) {
            try {
              resolve(JSON.parse(text));
            } catch (_) {
              resolve(text);
            }
            return;
          } else {
            if (res3.status == 308) {
              startByte += dataChunk.length;
              streamTrans.resume();
              return;
            }
            if (upCount == 3) {
              reject({ status: res3.status, error: text });
              return;
            }
            upCount++;
            console.log(`Retry: ${upCount} / 3`);
            console.log(text);
            await upload();
            return;
          }
        };

        await upload();
        bufferData = [left];
      }
    });
    streamTrans.on("end", async () => {
      const dataChunk = Buffer.concat(bufferData);
      if (dataChunk.length > 0) {
        // Upload last chunk.
        let upCount = 0;

        const upload = async function () {
          console.log(
            `Progress(last): from ${startByte} to ${
              startByte + dataChunk.length - 1
            } for ${dataSize}`
          );
          const res4 = await fetch(location, {
            method: "PUT",
            headers: {
              "Content-Range": `bytes ${startByte}-${
                startByte + dataChunk.length - 1
              }/${dataSize}`,
            },
            body: dataChunk,
          });
          const text = await res4.text();
          // console.log({ ok: res4.ok, status: res4.status, body: text }); // For debug
          if (res4.ok && res4.status == 200) {
            try {
              resolve(JSON.parse(text));
            } catch (_) {
              resolve(text);
            }
            return;
          } else {
            if (res4.status == 308) {
              startByte += dataChunk.length;
              streamTrans.resume();
              return;
            }
            if (upCount == 3) {
              reject({ status: res4.status, error: text });
              return;
            }
            upCount++;
            console.log(`Retry: ${upCount} / 3`);
            await upload();
            return;
          }
        };

        await upload();
      }
    });
    streamTrans.on("error", (err) => reject(err));
  });
}

module.exports = { resumableUpload };
