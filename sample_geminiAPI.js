const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager, FileState } = require("@google/generative-ai/server");
const { resumableUpload } = require("./resumableUploadForGoogleAPIs");

async function sample_geminiAPI() {

  const apiKey = "###"; // Please set your API key.

  const object = {
    // Set direct link of the file.
    fileUrl: "###",

    // If you want to use the file path of the local PC, please use filePath
    // filePath: "###",

    // Set URL for uploading with the resumable upload.
    resumableUrl: `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${apiKey}`,

    // Set data size (file size).
    dataSize: ###, // Please set the file size.

    // If you want to use your access token, please use this.
    // accessToken: "###",

    // Set metadata.
    metadata: { file: { displayName: "sampleVideo1", mimeType: "video/mp4" } },
  };
  const uploadResult = await resumableUpload(object).catch((err) =>
    console.log(err)
  );

  // The below script is from https://ai.google.dev/api/files#video
  const fileManager = new GoogleAIFileManager(apiKey);
  let file = await fileManager.getFile(uploadResult.file.name);
  while (file.state === FileState.PROCESSING) {
    process.stdout.write(".");
    // Sleep for 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    // Fetch the file from the API again
    file = await fileManager.getFile(uploadResult.file.name);
  }

  if (file.state === FileState.FAILED) {
    throw new Error("Video processing failed.");
  }

  // View the response.
  console.log(
    `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`
  );

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  const result = await model.generateContent([
    "Tell me about this video.",
    {
      fileData: {
        fileUri: uploadResult.file.uri,
        mimeType: uploadResult.file.mimeType,
      },
    },
  ]);
  console.log(result.response.text());
}

sample_geminiAPI();
