import express from "express";
import fs from 'fs';
import path from 'path';
import prompts from "./chatgpt/prompts.json";
import dotenv from "dotenv";
import { parseToBytes } from "./chatgpt/parse";

import OpenAI from "openai";

type dialogStorage = {
  [key: string]: {
    dialog: string[];
    dialogCounter: number;
  };
}

const storageFilePath = path.join(__dirname, 'dialogStorage.json');

// Function to load dialog storage
function loadDialogStorage() {
  if (fs.existsSync(storageFilePath)) {
    const fileContent = fs.readFileSync(storageFilePath, 'utf8');
    return JSON.parse(fileContent);
  }
  return {};
}

// Function to save dialog storage
function saveDialogStorage(storage: typeof dialogStorage) {
  fs.writeFileSync(storageFilePath, JSON.stringify(storage, null, 2), 'utf8');
}

// Initialize dialogStorage with data from file or as an empty object
const dialogStorage = loadDialogStorage();

dotenv.config();

const byteArray = [
  20,   8,  9, 19,  0,  9, 19,  0,  1, 254,
  19,   1, 13, 16, 12,  5,  0, 20,  5,  24,
  20, 254,  6, 15, 18,  0, 20,  8,  5, 254,
  16,  18, 15, 13, 16, 20,  0, 18, 21,  12,
   5,  19, 27, 255
];

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const app = express();
const port = 4000;

// System prompt
const systemPrompt = prompts.system.prompt;

console.log("using system prompt");
// console.log("systemPrompt", systemPrompt);
// console.log(parseToBytes("THIS IS A\nSAMPLE TEXT\nFOR THE\nPROMPT RULES."));

// Array of chat prompts
const chatPrompts = [
  { actorID: 0x0C, prompt: "Chat prompt 1" },
  { actorID: "2", prompt: "Chat prompt 2" },
  { actorID: "3", prompt: "Chat prompt 3" },
];

// Dictionary to store chat responses
const chatResponses: { [key: string]: string[] } = {};

async function getActorDialogue(actorID: string) {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompts.actors[actorID as keyof typeof prompts.actors].prompt },
    ],
    model: "gpt-4o",
  });

  console.log("completion:", completion.choices[0].message.content);

  
const regex = /\[(?:[^[\]]|\[(?:[^[\]]|\[[^[\]]*\])*\])*\]/s;
const match = regex.exec(completion.choices[0].message.content!);

  if (match) {
    // const stringObject = JSON.parse(completion.choices[0].message.content!.replace("/\\N/G", ''));
    const stringObject = JSON.parse(match[0].replace(/\\N/g, ''));
    return stringObject;
  } else {
    console.error("Failed to parse JSON object from completion");
    return;
  }
}

app.get("/dialog", async (req, res) => {
  const actorID = req.query.actorid as string;

  // res.json({message: "hello", bytes: byteArray, status: "success"});
  // return;

  if (!dialogStorage.hasOwnProperty(actorID)) {
    try {
      const dialogArray = await getActorDialogue(actorID);
      if (!dialogArray) {
        res.status(500).json({ message: "Failed to fetch dialog", status: "error" });
        return;
      }
      dialogStorage[actorID] = {
        dialog: dialogArray,
        dialogCounter: 0
      };
      const dialog = dialogArray[0];
      dialogStorage[actorID].dialogCounter += 1;
      res.json({ message: dialog, bytes: parseToBytes(dialog), status: "success" });
      
    } catch (error) {
      console.error("Failed to fetch dialog:", error);
      res.status(500).json({ message: "Failed to fetch dialog", status: "error" });
    }
  } else {
    const dialog = dialogStorage[actorID].dialog[dialogStorage[actorID].dialogCounter];
    dialogStorage[actorID].dialogCounter += 1;
    res.json({ message: dialog, bytes: parseToBytes(dialog), status: "success" });
    if (dialogStorage[actorID].dialogCounter >= dialogStorage[actorID].dialog.length) {
      dialogStorage[actorID].dialogCounter = 0;
      const dialogArray = await getActorDialogue(actorID);
      dialogStorage[actorID] = {
        dialog: dialogArray,
        dialogCounter: 0
      };
    }
  }
  saveDialogStorage(dialogStorage);
});

console.log("Sending system prompt");

app.get("/ping", (req, res) => {
  // Send a json response
  console.debug("pinged");

  // res.send("pong");
  setTimeout(() => {
    res.json({ message: "pong", status: "success" });
  }
  , 1000);
});

// Endpoint to check if system prompt and chat prompts are completed
app.get("/status", (req, res) => {
  const totalPrompts = chatPrompts.length;
  const completedPrompts = Object.keys(chatResponses).length;
  const progress = (completedPrompts / totalPrompts) * 100;

  if (completedPrompts === totalPrompts) {
    res.send("System prompt and chat prompts completed successfully");
  } else {
    res.send(
      `System prompt and chat prompts in progress (${progress}% completed)`
    );
  }
});

// Endpoint to get chat responses for a specific actorID
app.post("/responses", express.json(), (req, res) => {
  const actorID = req.body.actorID;
  const responses = chatResponses[actorID] || [];

  res.json(responses);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Send chat prompts on server startup
// chatPrompts.forEach((chatPrompt) => {
//   sendChatPrompt(chatPrompt.actorID, chatPrompt.prompt);
// });
