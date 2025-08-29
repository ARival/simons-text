import van from "./van-1.5.5.min.js";
import { insertHeader } from "/js/components/header.js";
import { insertModal, setModalText, setModalButtonsEnabled, showModal, closeModal } from "/js/components/modal.js";
insertHeader();

const { div, button, span, h3, select, option } = van.tags;

const {modal, modalConfirmButton, modalCancelButton} = insertModal();

// Reactive state
const appState = van.state({
  cachedActors: {},
  soundEnabled: false,
  selectedActor: "",
  progressText: "Clicking this will enable sound through the browser",
  preloadProgress: 0,
  singleLoadProgress: 0
});

// function to confirm what will be done in the modal
window.confirmModal = () => { console.warn('No action defined for modal confirm') };

const setButtonProgress = (type, progress) => {
  const buttonId = type === "preload" ? "preloadButton" : "single-load-button";
  const button = document.getElementById(buttonId);
  if (button) {
    button.setAttribute(
      "style",
      `background: linear-gradient(90deg, var(--button-bg-color) ${Math.round(
        progress
      )}%, black ${Math.round(progress)}%`
    );
  }
  
  if (type === "preload") {
    appState.val = { ...appState.val, preloadProgress: progress };
  } else {
    appState.val = { ...appState.val, singleLoadProgress: progress };
  }
}

const showClearCacheModal = () => {
  setModalText(
    "Confirm Clear Cache",
    "Are you sure you want to clear the cache? This cannot be undone."
  )
  
  const confirmAction = async () => {
    setModalButtonsEnabled(false);
    console.log('clearing cache...');
    try {
      const response = await fetch("/clear", { method: "POST" });
      console.log(response);
      await getCache();
    } finally {
      setModalButtonsEnabled(true);
      closeModal();
    }
  };
  
  showModal(confirmAction);
}

export const showRegenerateModal = () => {
  setModalText(
    "Confirm Regenerate Actor Text",
    "Are you sure you want to regenerate the text for this actor?"
  )
  
  const confirmAction = async () => {
    setModalButtonsEnabled(false);
    console.log('regenerating actor text...');
    try {
      await loadActor();
    } finally {
      setModalButtonsEnabled(true);
      closeModal();
    }
  };
  
  showModal(confirmAction);
}
window.showRegenerateModal = showRegenerateModal;

const ws = new WebSocket("ws://localhost:4000");

ws.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log(data);
  if (data.progress) {
    setButtonProgress(data.type, data.progress);
    appState.val = { 
      ...appState.val, 
      progressText: `${Math.round(data.progress)}% completed` 
    };
    // Update progress text display
    const progressElements = document.querySelectorAll("#progressText");
    progressElements.forEach(el => {
      el.innerText = appState.val.progressText;
    });
  }
  if (data.message) {
    appState.val = { ...appState.val, progressText: data.message };
    const progressElements = document.querySelectorAll("#progressText");
    progressElements.forEach(el => {
      el.innerText = data.message;
    });
    setButtonProgress(data.type, 100);
  }
  if (data.sound) {
    // sound should contain the URL of the sound file
    const audio = new Audio(data.sound);
    audio.volume = 0.5;
    audio.loop = false;
    audio.onerror = (error) => {
      console.error("Error playing sound:", error);
    };
    audio.onplay = () => {
      console.log("Sound is playing");
    };
    audio.play();
  }
};

const handlePreload = () => {
  document.getElementById("preloadButton").disabled = true;
  setButtonProgress("preload", 0);
  fetch("/preload", { method: "POST" })
    .then((response) => response.json())
    .then((data) => {
      console.log(data.message);
      getCache();
  });
};

const handleClearCache = () => {
  showClearCacheModal();
};

const handleEnableSound = (e) => {
  appState.val = { ...appState.val, soundEnabled: true };
  document.getElementById("enableSoundButton").disabled = true;
  fetch("/rendervoice", { 
    method: "POST", 
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      'dialog': "here is a test rendering. I hope this works out before dracula rises."
     })
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
  });
};

const loadActor = async () => {
  const actorId = appState.val.selectedActor;
  await fetch("/preload", { 
    method: "POST", 
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ actorId })
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data.message);
      getCache();
  });
  console.log("fetching actorId: ", actorId)
}

const actorChange = () => {
  const actorSelect = document.getElementById("actor-select");
  const actorId = actorSelect.value;
  appState.val = { ...appState.val, selectedActor: actorId };
  
  const actor = appState.val.cachedActors[actorId];
  const dialogDisplay = document.getElementById("form-dialog-display");
  
  if (actor?.dialog) {
    dialogDisplay.innerHTML = actor.dialog
      .map(
        (dialog) =>
          `<div class="form-dialog-text">${dialog}<button class="form-dialog-close-button" /><img src="./images/close.svg" alt="close button" /></div>`
      )
      .join("");
  } else {
    dialogDisplay.innerHTML =
      "<div>No dialog found for this actor.</div><button id='single-load-button' onclick='loadActor()'>Fetch Dialog</button>";
  }
};

window.actorChange = actorChange;
window.loadActor = loadActor;

const getCache = async () => {
  try {
    const response = await fetch("/cache");
    const data = await response.json();
    appState.val = { ...appState.val, cachedActors: data };
    
    const currentSelected = appState.val.selectedActor;
    const actorSelect = document.getElementById("actor-select");
    
    if (actorSelect) {
      actorSelect.innerHTML = Object.keys(data)
        .map((actorId) => `<option value="${actorId}">${actorId}</option>`)
        .join("");
      if (currentSelected) {
        actorSelect.value = currentSelected;
      }
    }
    actorChange();
  } catch (error) {
    console.log(error)
  }
};

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  const preloadButton = document.getElementById("preloadButton");
  const clearCacheButton = document.getElementById("clear-cache-button");
  const enableSoundButton = document.getElementById("enableSoundButton");
  
  if (preloadButton) preloadButton.addEventListener("click", handlePreload);
  if (clearCacheButton) clearCacheButton.addEventListener("click", handleClearCache);
  if (enableSoundButton) enableSoundButton.addEventListener("click", handleEnableSound);
});

getCache();
