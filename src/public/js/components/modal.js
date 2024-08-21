const parser = new DOMParser();

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

export const insertModal = () => {
  console.log('inserting modal');
  const modal = parser.parseFromString(modalHTML, 'text/html').body.firstChild;

  const app = document.getElementById('app');
  app.appendChild(modal);
};
