import express from "express";
import axios from "axios";

const app = express();
const port = 4000;

// System prompt
const systemPrompt =
  "We will be generating text within these very strict boundaries: Characters per line: 12 characters (spaces count toward this limit). Lines per dialog box: anywhere from 2 lines to 5 lines, with 5 lines being the maximum. Max characters per dialog interaction: 60 characters. Manual carriage returns: Necessary after each line to maintain the format within the 12-character limit per line. Case: All upper case letters. Prose: They will be a single statement from a single in-game character about whatever subject is presented Sets: each generated dialog will be a single isolated instance adhering to these rules. Generate multiple only when asked. Note that YOU don’t have to adhere to these rules when speaking to me, they will apply only to the dialogs we generate. All of this will take place with the universe of Castlevania: Simon's Quest for the NES.  Again: 12 characters per line! 5 lines max! These are the most important requirements!";

// Array of chat prompts
const chatPrompts = [
  { actorID: "1", prompt: "Chat prompt 1" },
  { actorID: "2", prompt: "Chat prompt 2" },
  { actorID: "3", prompt: "Chat prompt 3" },
];

// Dictionary to store chat responses
const chatResponses: { [key: string]: string[] } = {};

// Function to send chat prompt to ChatGPT API
async function sendChatPrompt(actorID: string, prompt: string) {
  const response = await axios.post(
    "https://api.chatgpt.com/v1/chat/completions",
    {
      model: "chatgpt4o",
      messages: [
        { role: "system", content: systemPrompt },
        // { role: "user", content: prompt },
      ],
    },
    {

    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    }
  );

  const chatResponse = response.data.choices[0].message.content;
  if (chatResponses[actorID]) {
    chatResponses[actorID].push(chatResponse);
  } else {
    chatResponses[actorID] = [chatResponse];
  }
}

app.get("/ping", (req, res) => {
  // Send a json response
  console.debug("pinged");
  // res.send("pong");
  res.json({ message: "pong", status: "success" });
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
