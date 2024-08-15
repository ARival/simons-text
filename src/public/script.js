let cachedActors = {};

let modal = document.getElementById("modal");
let modalTitle = document.getElementById("modal-title");
let modalBody = document.getElementById("modal-body-text");
let modalConfirmButton = document.getElementById("modal-confirm-button");
let modalCancelButton = document.getElementById("modal-cancel-button");
console.log('modalConfirmButton', modalConfirmButton);

// function to confirm what will be done in the modal
let confirmModal = () => { console.warn('No action defined for modal confirm') };

const showModal = () => {
  modal.showModal();
}

const closeModal = () => {
  modal.close();
}

const setModalButtonsEnabled = (enabled) => {
  modalConfirmButton.disabled = !enabled;
  modalCancelButton.disabled = !enabled;
  modalConfirmButton.children[1].hidden = enabled;
  // modalCancelButton.children[1].hidden = enabled;
}



const showClearCacheModal = () => {
  modalTitle.innerText = "Confirm Clear Cache";
  modalBody.innerText = "Are you sure you want to clear the cache? This cannot be undone.";
  confirmModal = () => {
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

const showRegenerateModal = () => {
  modalTitle.innerText = "Confirm Regenerate Actor Text";
  modalBody.innerText = "Are you sure you want to regenerate the text for this actor?";
  confirmModal = async () => {
    setModalButtonsEnabled(false);
    console.log('regenerating actor text...');
    await loadActor().then(() => {
      setModalButtonsEnabled(true);
      closeModal();
    });
  }
  showModal();
}

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

const getCache = () => {
  fetch("/cache", { method: "GET" })
    .then((response) => response.json())
    .then((data) => {
      cachedActors = data;
      const currentSelected = document.getElementById("actor-select").value;
      console.log('currentSelected', currentSelected);
      document.getElementById("actor-select").innerHTML = Object.keys(data)
        .map((actorId) => `<option value="${actorId}">${actorId}</option>`)
        .join("");
      if (currentSelected) {
        document.getElementById("actor-select").value = currentSelected;
      }
      console.log(data);
      actorChange();
    });
};

getCache();
