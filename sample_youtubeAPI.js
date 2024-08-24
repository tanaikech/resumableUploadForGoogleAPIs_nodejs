const { resumableUpload } = require("./resumableUploadForGoogleAPIs");

function sample_youtubeAPI() {
  const object = {
    // Set direct link of the file.
    fileUrl: "###",

    // If you want to use the file path of the local PC, please use filePath
    // filePath: "###",

    // Set data size (file size).
    dataSize: ###, // Please set the file size.

    // Set URL for uploading with the resumable upload.
    resumableUrl: "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",

    // Set your access token.
    accessToken: "###",

    // Set metadata.
    metadata: {
      snippet: {
        description: "Upload sample.",
        title: "Sample uploaded video.",
      },
      status: { privacyStatus: "private" },
    }
  };
  resumableUpload(object)
    .then((res) => console.log(res))
    .catch((err) => console.log(err));
}

sample_youtubeAPI();
