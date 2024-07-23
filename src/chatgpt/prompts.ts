export const prompts = {
  "system": {
    "prompt": "We will generate text within these very strict boundaries:\n\n- Characters per line: 12 characters (spaces count toward this limit).\n- Lines per dialog box: Anywhere from 2 lines to 5 lines, with 5 lines being the maximum.\n- Max characters per dialog interaction: 60 characters.\n- Manual carriage returns: Necessary after each line to maintain the format within the 12-character limit per line.\n- Case: All upper case letters.\n- Prose: A single statement from a single in-game character about the presented subject.\n- Sets: Each generated dialog will be a single isolated instance adhering to these rules. Generate multiple only when asked.\n\nExample Output Format:\n\n[\n  \"THIS IS A\\nSAMPLE TEXT\\nFOR THE\\nPROMPT RULES.\",\n  \"ANOTHER TEXT\\nTO DEMONSTRATE\\nFORMATTING.\"\n]\n\nImportant Notes:\n\n- You don’t have to adhere to these rules when speaking to me; they apply only to the dialogs we generate.\n- All dialogs will take place in the universe of Castlevania: Simon's Quest for the NES."
  },
  "actors": {
    "0": {
      "prompt": "Generate 10 permutations of the term 'what a horrible night to have a curse.'"
    },
    "38": {
      "prompt": "Generate 10 Dialogs from a wiseman who is very knowledgeable about the crystals in this world, though he only really has information about the white one. He's seen the sadness slowly taking over the town due to the monsters roaming the land, and has heard of the belmont family, and appreciates their help, but is resentful due to the Belmonts indirectly unleashing the monsters upon the land via their actions. Alternate between talking about needing to buy a white crystal in this town, how the white crystal helps see things that are unseen normally, the state of the country after the monsters have come, how old he is, how the villagers don't feel you are welcome here, or anything related to these subjects."
    },
    "3D": {
      "prompt": "Generate 10 Dialogs from a wiseman who has info that someone in the town of Aldra will play a very important role in your quest, and how you must find him. He also knows that this person also hunts the supernatural, and is part of a guild of hunters. He also knows that this person might be looking for an artifact or magic item. He will talk to you about anything related to these subjects."
    },
    "3E": {
      "prompt": "Generate 10 Dialogs from a wiseman who knows about the 13 clues of dracula, a collection of 13 books which contain the secrets to defeating dracula. He knows these books are hidden in false walls all throughout your adventure, though he isn't sure what they contain. He will talk about the clues, how they can help you, how they can be found, or anything related to these subjects."
    },
    "41": {
      "prompt": "Generate 10 Dialogs from an old man who used to be involved with the church. His main source of knowledge revolves around how holy water can be used to defeat evil monsters AND illusions. He will reply about holy water's magical properties, how monsters hate holy water, how holy water can destroy evil illusions, that holy water can be bought in this town, or anything related to these subjects."
    },
    "4C": {
      "prompt": "Generate 10 Dialogs from an old man who is randomly rambles about people being in cahoots with Dracula. He will reply with imagined behaviors of people in town, how people will deceive you, how dracula is driving people insane, or anything related to these subjects."
    },
    "4D": {
      "prompt": "Generate 10 Dialogs from an rambling young man who has heard about a sacred flame. He speaks in a tone that makes him seem unreliable. He doesn't know quite where it is, but he saw a map that might lead to it, and the x on that map was right by the Denis woods.. He will talk about the sacred flame (random things he has heard about it), the map (and how it got destroyed in a fire), how the flame could actually be somewhere completely different, or anything related to these subjects."
    },
    "4E": {
      "prompt": "Generate 10 Dialogs from an rambling young man who as heard rumors that info on Dracula's clues can be found in Veros."
    },
    "31": {
      "prompt": "Generate 10 Dialogs from a priest in the church. The priest is very kind, and geniuinely cares about the villagers. He is familiar with the Belmont family, and is sympathetic to the curse that has befallen you. Resting at the church will heal you. Most often, he will talk about resting at the church to heal your wounds, but he will also sometimes discuss the curse on you, the belmont family, the church, the town, the difficulty in healing villagers hurt by monsters, the demons that roam at night, or anything related to these subjects."
    },
    "44": {
      "prompt": "Generate 10 Dialogs from a man who knows of a ferryman who can guide people around the river. He also believes that the ferryman is a fan of garlic, but admits that he doesn't know for sure. He will talk about the ferryman, the river, how the ferryman might like garlic but it may be something else he seeks, how many people have died trying to cross the river, how he doesn't know where to get garlic, the monsters, or anything related to these subjects."
    },
    "32": {
      "prompt": "Generate 10 Dialogs from a mysterious merchant who sells the white crystal. Only generate 2 lines of text per dialog, and always be related to white crystal sales."
    },
    "33": {
      "prompt": "Generate 10 Dialogs from a mysterious merchant who sells the thorn whip, which will give you a more damaging basic attack. Only generate 2 lines of text per dialog, and always be related to thorn whip sales."
    },
    "37": {
      "prompt": "Generate 10 Dialogs from a mysterious merchant who sells the holy water. Only generate 2 lines of text per dialog, and always be related to holy water sales."
    },
    "B": {
      "prompt": "Generate 10 dialogs from the ferryman who will take you across the river. He will say something along the lines of taking you to a good place, but he's obviously lying. He also often laughs when saying this."
    },
    "C": {
      "prompt": "Generate 10 dialogs from the ferryman who will take you across the river. He can can sense that you have Dracula's heart, and will take you to the actual place you need to go to complete your quest. He refers to Dracula's heart ambiguously."
    }
  }
}