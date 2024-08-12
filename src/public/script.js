
let cachedActors = {};

let modal = document.getElementById("modal");

const showModal = () => {
  modal.showModal();
}

const closeModal = () => {
  modal.close();
}

const setButtonProgress = (type, progress ) => {
  document
    .getElementById(type === "preload" ? "preloadButton" : "single-load-button")
    .setAttribute(
      "style",
      `background: linear-gradient(90deg, var(--button-bg-color) ${Math.round(
        data.progress
      )}%, black ${Math.round(data.progress)}%`
    );
}

const ws = new WebSocket("ws://localhost:4000");

ws.onmessage = function (event) {
  const data = JSON.parse(event.data);
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
    .then((data) => console.log(data.message));
});

const loadActor= () => {
  const actorId = document.getElementById("actor-select").value;
  fetch("/preload", { 
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
