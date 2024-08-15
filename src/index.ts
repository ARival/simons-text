import express from "express";
import fs, { readFileSync } from 'fs';
import path from 'path';
import dotenv from "dotenv";
import { parseToBytes } from "./chatgpt/parse";
import { WebSocket } from "ws";
import http from 'http';
import figlet from 'figlet';

import OpenAI from "openai";
import { exit } from "process";

type dialogStorage = {
  [key: string]: {
    dialog: string[];
    dialogCounter: number;
  };
}

type Prompts = {
  system?: {
    prompt: string;
  };
  actors?: {
    [key: string]: {
      prompt: string;
    };
  };
};

const storageFilePath = path.join(__dirname, 'dialogStorage.json');
const promptPath = path.join(__dirname, 'chatgpt/prompts.json');

const prompts: Prompts = {}

const loadPrompts = () => {
  if (fs.existsSync(promptPath)) {
    const fileContent = JSON.parse(readFileSync(promptPath, 'utf8'));
    prompts.system = fileContent.system;
    prompts.actors = fileContent.actors;
    console.log("Prompts loaded");
  } else {
    console.error("Failed to load prompts. Please ensure chatgpt/prompts.json exists and is formatted correctly.");
    exit(1);
  }
}

loadPrompts();

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
let dialogStorage = loadDialogStorage();

dotenv.config();


// Initialize the OpenAI API
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const app = express();
app.use(express.json());
const port = 4000;

// WebSocket setup (using ws library for simplicity)
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send(JSON.stringify('Connection established'));
});

// System prompt
const systemPrompt = prompts.system!.prompt;

// Function to send a chat prompt to OpenAI
// we use gpt-4o here, but other models may work.
// I found it to be the most consistent with the NES constraints.
async function getActorDialog(actorID: string) {
  if (!prompts.actors!.hasOwnProperty(actorID as keyof typeof prompts.actors)) {
    console.error(`Actor ID ${actorID} not found in prompts`);
    return;
  } 
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompts.actors![actorID as keyof typeof prompts.actors].prompt },
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

const loadActorData = async (actorID: string) => {
  try {
    const dialogArray = await getActorDialog(actorID);
    if (!dialogArray) {
      console.error(`Failed to fetch dialog for actor ${actorID}`);
      return;
    }
    dialogStorage[actorID] = {
      dialog: dialogArray,
      dialogCounter: 0
    };
    saveDialogStorage(dialogStorage);
  } catch (error) {
    console.error(`Failed to fetch dialog for actor ${actorID}:`, error);
  }
}

// Endpoint to get the cached dialog for all actors
app.get("/cache", (req, res) => {
  const actorIDs = Object.keys(prompts.actors!);
  const cachedDialogs: { [key: string]: { dialog: string[] | undefined} } = {};
  for (const actorID of actorIDs) {
    cachedDialogs[actorID] = dialogStorage[actorID] ?? {};
  }

  res.json(cachedDialogs);
}
);

app.get("/dialog", async (req, res) => {
  const actorID = req.query.actorid as string;
  if (!actorID) {
    res.status(400).json({ message: "Actor ID is required", status: "error" });
    return;
  }

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
  if (prompts.actors!.hasOwnProperty(actorID as keyof typeof prompts.actors)) {
    console.log("actorID found");
    res.status(200).send("success");
  } else {
    console.log("actorID NOT found");
    res.status(404).json({ message: "Actor ID not found", status: "error" });
  }
});

app.use(express.static('src/public'));

// New endpoint to start preload
app.post('/preload', async (req, res) => {
  let isPreload= true;
  let actorsToPreload: string[]; 
  if (req.body.actorId) {
    if (Object.keys(prompts.actors!.hasOwnProperty(req.body.actorId as keyof typeof prompts.actors))) {
      actorsToPreload = [req.body.actorId as string];
      isPreload = false;
    } else {
      res.status(404).json({ message: "Actor ID not found", status: "error" });
      return;
    }
  } else {
    actorsToPreload = Object.keys(prompts.actors!).filter((actorID) => !dialogStorage.hasOwnProperty(actorID));
  }
  let loaded = 0;
  const total = actorsToPreload.length;

  console.log(`Preloading ${total} actors`);
  console.log(actorsToPreload);

  if (total === 0) {
    res.json({ message: 'No Actors to Preload!' });
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ message: "No Actors to Preload!" }));
      }
    });
    return;
  }

  for (const actorID of actorsToPreload) {
    await loadActorData(actorID);
    loaded++;
    const progress = (loaded / total) * 100;
    // Notify all connected clients
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ progress, type: isPreload ? 'preload' : 'single'}));
      }
    });
  }

  // Notify completion
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ message: 'Preload complete!' }));
    }
  });

  res.json({ message: 'Preload started' });
});

app.post('/clear', (req, res) => {
  dialogStorage = {};
  saveDialogStorage({});
  console.log('Dialog storage cleared');
  res.json({ message: 'Dialog storage cleared' });
});

app.get('/prompts-list', (req, res) => {
  res.json(prompts);
});


// Start the server
server.listen(port, () => {
  console.log(figlet.textSync("Simon's Text", {
    font: 'Kban',
  }));
  console.log(`Server is running on port ${port}`);
});

// TODO: Implement "pre-baking" of chat prompts
// ie. generate all chat prompts on launch and store them in dialogStorage
// Send chat prompts on server startup
