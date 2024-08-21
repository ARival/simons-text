import { getImageTag } from "./prompts-render.js";
import { insertHeader } from "/js/components/header.js";
import { insertModal } from "/js/components/modal.js";

insertHeader();
insertModal();

let cachedData = {};

let modalConfirmButton = document.getElementById("modal-confirm-button");
let modalCancelButton = document.getElementById("modal-cancel-button");

const updatePrompt = (actorId) => {
  fetch('/update-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      actorId,
      prompt: document.getElementById(`prompt-${actorId}`).value
    })
  }).then(() => {
    document.getElementById(`prompt-${actorId}`).nextElementSibling.setAttribute('hidden', true);
    console.log('prompt updated');
  });
};

window.updatePrompt = updatePrompt;

const compareTextareaToCached = (e) => {
  // console.log('compareTextareaToCached', e.target.value);
  // console.log('cachedData', cachedData);
  if (e.target.value !== cachedData.actors[e.target.id.split('-')[1]].prompt) {
    e.target.nextElementSibling.removeAttribute('hidden');
  } else {
    e.target.nextElementSibling.setAttribute('hidden', true);
  }
}

fetch('/prompts-list', { method: 'GET' })
  .then((response) => response.json())
  .then((data) => {
    console.log(data);

    cachedData = data;

    const elemArray = Object.entries(data.actors).map(([id, actor]) => {
      console.log('actor', actor);
      console.log('id', id);
      // const promptElement = document.createElement('textarea');
      // promptElement.innerHTML = actor.prompt;
      return /* html */`
        <div class="form-prompt-container">
          <div class="form-prompt-header">
            <div class="form-prompt-image-container">
              ${getImageTag(actor.type)}
            </div>
            <div class="form-prompt-title">
              <span class="form-prompt-address">0x${id}</span>
              <span class="form-prompt-actor-title">${actor.type}</span>
            </div>
          </div>
          <div class="form-prompt-textarea-container">
            <!-- <label for="form-prompt-textarea" class="form-prompt-textarea-label">Prompt</label> -->
            <textarea id="prompt-${id}" class="form-prompt-textarea">${actor.prompt}</textarea>
            <button class="form-prompt-save-button" onclick="updatePrompt('${id}')" hidden><img src="/images/save.svg" /></button>
          </div>
        </div>
        `
      ;
    });

    document.getElementById('prompts-container-system').innerHTML = cachedData.system.prompt;
    document.getElementById('prompts-container').innerHTML = elemArray.join('');
    document.querySelectorAll('.form-prompt-textarea').forEach((textarea) => {
      textarea.addEventListener('input', compareTextareaToCached);
    });
  });