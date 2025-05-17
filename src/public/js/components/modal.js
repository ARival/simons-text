const parser = new DOMParser();

let modal;
let modalTitle;
let modalBody;
let modalConfirmButton;
let modalCancelButton;

const modalHTML = /*html */`
  <dialog id="modal">
    <div id="modal-content">
      <div id="modal-header">
        <h3 id="modal-title">Confirm Preload</h3>
        <button id="button-modal-close" onclick="closeModal()"><img src="/images/close.svg" alt="close" id="modal-close" ></button>
      </div>
      <div id="modal-body">
        <span id="modal-body-text">Preloading may take several minutes.</span>
        <div id="modal-buttons">
          <button id="modal-confirm-button" onclick="confirmModal()"><span>Confirm</span><div class="loading-spinner" hidden></div></button>
          <button id="modal-cancel-button" onclick="closeModal()"><span>Cancel</span><div class="loading-spinner" hidden></div></button>
        </div>
      </div>
    </div>
  </dialog>
`

export const setModalText = (title, description) => {
  if (!modal || !modalTitle || !modalBody) {
    throw error ("Modal not initialized.");
  }

  modalTitle.innerText = title;
  modalBody.innerText = description;
}

export const insertModal = () => {
  console.log('inserting modal');
  const modalElem = parser.parseFromString(modalHTML, 'text/html').body.firstChild;

  const app = document.getElementById('app');
  app.appendChild(modalElem);

  modal = document.getElementById("modal");
  modalTitle = document.getElementById("modal-title");
  modalBody = document.getElementById("modal-body-text");
  modalConfirmButton = document.getElementById("modal-confirm-button");
  modalCancelButton = document.getElementById("modal-cancel-button");

  return ({
    modal,
    modalConfirmButton,
    modalCancelButton,
    setModalText
  })
};
