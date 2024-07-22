import express from "express";
import fs from 'fs';
import path from 'path';
import { prompts } from "./chatgpt/prompts";
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


// Initialize the OpenAI API
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const app = express();
const port = 4000;

// System prompt
const systemPrompt = prompts.system.prompt;

console.log("using system prompt");

// Function to send a chat prompt to OpenAI
// we use gpt-4o here, but other models may work.
// I found it to be the most consistent with the NES constraints.
async function getActorDialog(actorID: string) {
  if (!prompts.actors.hasOwnProperty(actorID as keyof typeof prompts.actors)) {
    console.error(`Actor ID ${actorID} not found in prompts`);
    return;
  } 
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
    const stringObject = JSON.parse(match[0].replace(/\\N/g, '\\n'));
    return stringObject;
  } else {
    console.error("Failed to parse JSON object from completion");
    return;
  }
}

app.get("/dialog", async (req, res) => {
  const actorID = req.query.actorid as string;

  if (!dialogStorage.hasOwnProperty(actorID) || !dialogStorage[actorID].dialog) {
    try {
      const dialogArray = await getActorDialog(actorID);
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
      const dialogArray = await getActorDialog(actorID);
      dialogStorage[actorID] = {
        dialog: dialogArray,
        dialogCounter: 0
      };
    }
  }
  saveDialogStorage(dialogStorage);
});

// Endpoint to check if the passed actorID is in prompts.ts
app.get("/actors", (req, res) => {
  const actorID = req.query.actorid as string;
  console.log("actorID", actorID);
  if (prompts.actors.hasOwnProperty(actorID as keyof typeof prompts.actors)) {
    console.log("actorID found");
    res.status(200).send("success");
  } else {
    console.log("actorID NOT found");
    res.status(404).json({ message: "Actor ID not found", status: "error" });
  }
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


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// TODO: Implement "pre-baking" of chat prompts
// ie. generate all chat prompts on launch and store them in dialogStorage
// Send chat prompts on server startup
// chatPrompts.forEach((chatPrompt) => {
//   sendChatPrompt(chatPrompt.actorID, chatPrompt.prompt);
// });
