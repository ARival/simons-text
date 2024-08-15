
let cachedActors;

fetch('/prompts-list', { method: 'GET' })
  .then((response) => response.json())
  .then((data) => {
    console.log(data);

    cachedActors = data.actors;

    const elemArray = Object.values(data.actors).map((actor) => {
      console.log('actor', actor);
      // const promptElement = document.createElement('textarea');
      // promptElement.innerHTML = actor.prompt;
      return `<div class="form-prompt-container"><div class="form-prompt-image-container"><img style="object-position: ${Math.floor(Math.random() * 14) * -64}px" src="/images/actors.png" width="64px" height="128px"/></div><textarea>${actor.prompt}</textarea></div>`;
    });

    document.getElementById('prompts-container').innerHTML = elemArray.join('');
  });