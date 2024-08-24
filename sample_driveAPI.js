const { resumableUpload } = require("./resumableUploadForGoogleAPIs");

function sample_driveAPI() {
  const object = {
    // Set direct link of the file.
    fileUrl: "###",

    // If you want to use the file path of the local PC, please use filePath
    // filePath: "###",

    // Set data size (file size).
    dataSize: ###, // Please set the file size.

    // Set URL for uploading with the resumable upload.
    resumableUrl: "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",

    // Set your access token.
    accessToken: "###",

    // Set metadata.
    metadata: { name: "sample filename", mimeType: "your mimeType" },
  };
  resumableUpload(object)
    .then((res) => console.log(res))
    .catch((err) => console.log(err));
}

sample_driveAPI();
