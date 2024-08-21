const parser = new DOMParser();

export const insertHeader = (activeMenu) => 
{
  const header = parser.parseFromString(/* html */ `
    <nav id="header">
      <div id="left-nav">
        <a href="/"><span id="nav-logo">ST</span></a>
        <a class="${activeMenu === "prompt" ? "nav-selected" : ""}" href="/prompts">prompts</a>
      </div>
      <div id="right-nav">
        <a href="https://github.com/ARival/simons-text" target="_blank"><img style="width: 1.5rem;" src="/images/github-mark-white.svg" alt="project github"/></a>
        <!-- <button onclick="showModal()"><span>Modal</span><div class="loading-spinner" hidden></div></button> -->
      </div>
    </nav>
  `, 'text/html').body.firstChild;

  const app = document.getElementById('app');
  app.insertBefore(header, app.firstChild);

}
