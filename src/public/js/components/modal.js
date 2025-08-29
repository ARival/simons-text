import van from "../../van-1.5.5.min.js";

const { dialog, div, h3, button, span, img } = van.tags;

// Reactive state
const modalState = van.state({
  isOpen: false,
  title: "Confirm",
  bodyText: "Are you sure?",
  confirmAction: () => {},
  buttonsDisabled: false
});

let modalElement;

export const setModalText = (title, description) => {
  modalState.val = {
    ...modalState.val,
    title,
    bodyText: description
  };
};

export const setModalButtonsEnabled = (enabled) => {
  modalState.val = {
    ...modalState.val,
    buttonsDisabled: !enabled
  };
};

export const showModal = (confirmAction = null) => {
  if (confirmAction) {
    modalState.val = {
      ...modalState.val,
      confirmAction
    };
  }
  modalState.val = { ...modalState.val, isOpen: true };
  modalElement?.showModal();
};

export const closeModal = () => {
  modalState.val = { ...modalState.val, isOpen: false };
  modalElement?.close();
};

const handleConfirm = async () => {
  if (modalState.val.confirmAction) {
    await modalState.val.confirmAction();
  }
};

export const createModal = () => {
  const modal = dialog({ id: "modal" },
    div({ id: "modal-content" },
      div({ id: "modal-header" },
        h3({ id: "modal-title" }, () => modalState.val.title),
        button({ 
          id: "button-modal-close",
          class: "btn-icon",
          onclick: closeModal 
        }, 
          img({ src: "/images/close.svg", alt: "close", id: "modal-close" })
        )
      ),
      div({ id: "modal-body" },
        span({ id: "modal-body-text" }, () => modalState.val.bodyText),
        div({ id: "modal-buttons" },
          button({ 
            id: "modal-confirm-button",
            class: "btn-primary btn-with-spinner",
            onclick: handleConfirm,
            disabled: () => modalState.val.buttonsDisabled
          }, 
            span("Confirm"),
            div({ class: "loading-spinner", hidden: () => !modalState.val.buttonsDisabled })
          ),
          button({ 
            id: "modal-cancel-button",
            class: "btn-secondary",
            onclick: closeModal,
            disabled: () => modalState.val.buttonsDisabled
          }, 
            span("Cancel")
          )
        )
      )
    )
  );
  
  return modal;
};

export const insertModal = () => {
  const app = document.getElementById('app');
  modalElement = createModal();
  van.add(app, modalElement);

  // For backward compatibility, attach to window
  window.confirmModal = () => {
    if (modalState.val.confirmAction) {
      modalState.val.confirmAction();
    }
  };
  window.showModal = showModal;
  window.closeModal = closeModal;

  return {
    modal: modalElement,
    modalConfirmButton: modalElement.querySelector('#modal-confirm-button'),
    modalCancelButton: modalElement.querySelector('#modal-cancel-button'),
    setModalText,
    setModalButtonsEnabled,
    showModal,
    closeModal
  };
};
