import { insertHeader } from "/js/components/header.js";
import { insertModal } from "/js/components/modal.js";

insertHeader();
const {modal, setModalText, modalConfirmButton, modalCancelButton} = insertModal();

let cachedActors = {};
let soundEnabled = false;

// function to confirm what will be done in the modal
window.confirmModal = () => { console.warn('No action defined for modal confirm') };

const showModal = () => {
  modal.showModal();
}
window.showModal = showModal;

const closeModal = () => {
  modal.close();
}
window.closeModal = closeModal;

const setModalButtonsEnabled = (enabled) => {
  modalConfirmButton.disabled = !enabled;
  modalCancelButton.disabled = !enabled;
  modalConfirmButton.children[1].hidden = enabled;
  // modalCancelButton.children[1].hidden = enabled;
}


const showClearCacheModal = () => {
  setModalText(
    "Confirm Clear Cache",
    "Are you sure you want to clear the cache? This cannot be undone."
  )
  window.confirmModal = () => {
    setModalButtonsEnabled(false);
    console.log('clearing cache...');
    fetch("/clear", { method: "POST" }).then((response) => {
      console.log(response);
      getCache();
      setModalButtonsEnabled(true);
      closeModal();
    });
  }
  // modalConfirmButton.setAttribute("onclick", "alert('hey')");
  showModal();
}

export const showRegenerateModal = () => {
  setModalText(
    "Confirm Regenerate Actor Text",
    "Are you sure you want to regenerate the text for this actor?"
  )
  window.confirmModal = async () => {
    setModalButtonsEnabled(false);
    console.log('regenerating actor text...');
    await loadActor().then(() => {
      setModalButtonsEnabled(true);
      closeModal();
    });
  }
  showModal();
}
window.showRegenerateModal = showRegenerateModal;

const setButtonProgress = (type, progress ) => {
  document
    .getElementById(type === "preload" ? "preloadButton" : "single-load-button")
    .setAttribute(
      "style",
      `background: linear-gradient(90deg, var(--button-bg-color) ${Math.round(
        progress
      )}%, black ${Math.round(progress)}%`
    );
}

const ws = new WebSocket("ws://localhost:4000");

ws.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log(data);
  if (data.progress) {
    setButtonProgress(data.type, data.progress);
    document.getElementById("progressText").innerText = `${Math.round(
      data.progress
    )}% completed`;
  }
  if (data.message) {
    document.getElementById("progressText").innerText = data.message;
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

document.getElementById("preloadButton").addEventListener("click", () => {
  document.getElementById("preloadButton").disabled = true;
  setButtonProgress("preload", 0);
  fetch("/preload", { method: "POST" })
    .then((response) => response.json())
    .then((data) => {
      console.log(data.message);
      getCache();
  });
});

document.getElementById("clear-cache-button").addEventListener("click", () => {
  showClearCacheModal();
});

document.getElementById("enableSoundButton").addEventListener("click", (e) => {
  soundEnabled = true;
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
      // getCache();
  });
});

const loadActor = async () => {
  const actorId = document.getElementById("actor-select").value;
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
  const actorId = document.getElementById("actor-select").value;
  const actor = cachedActors[actorId];
  if (actor?.dialog) {
    document.getElementById("form-dialog-display").innerHTML = actor.dialog
      .map(
        (dialog) =>
          `<div class="form-dialog-text">${dialog}<button class="form-dialog-close-button" /><img src="./images/close.svg" alt="close button" /></div>`
      )
      .join("");
  } else {
    document.getElementById("form-dialog-display").innerHTML =
      "<div>No dialog found for this actor.</div><button id='single-load-button' onclick='loadActor()'>Fetch Dialog</button>";
  }
  // console.log(actor.dialog);
};

window.actorChange = actorChange;

const getCache = async () => {
  try {
    const response = await fetch("/cache");
    const data = await response.json();
    cachedActors = data;
    const currentSelected = document.getElementById("actor-select").value;
    document.getElementById("actor-select").innerHTML = Object.keys(data)
      .map((actorId) => `<option value="${actorId}">${actorId}</option>`)
      .join("");
    if (currentSelected) {
      document.getElementById("actor-select").value = currentSelected;
    }
    actorChange();
  } catch (error) {
    console.log(error)
  }
  // fetch("/cache", { method: "GET" })
  //   .then((response) => response.json())
  //   .then((data) => {
  //     cachedActors = data;
  //     const currentSelected = document.getElementById("actor-select").value;
  //     console.log('currentSelected', currentSelected);
  //     document.getElementById("actor-select").innerHTML = Object.keys(data)
  //       .map((actorId) => `<option value="${actorId}">${actorId}</option>`)
  //       .join("");
  //     if (currentSelected) {
  //       document.getElementById("actor-select").value = currentSelected;
  //     }
  //     console.log(data);
  //     actorChange();
  //   });
};

getCache();
