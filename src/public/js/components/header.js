import van from "../../van-1.5.5.min.js";

const { nav, div, a, span, img } = van.tags;

export const createHeader = (activeMenu = "") => {
  return nav({ id: "header" },
    div({ id: "left-nav" },
      a({ href: "/" }, span({ id: "nav-logo" }, "ST")),
      a({ 
        class: activeMenu === "prompt" ? "nav-selected" : "",
        href: "/prompts" 
      }, "prompts")
    ),
    div({ id: "right-nav" },
      a({ 
        href: "https://github.com/ARival/simons-text", 
        target: "_blank" 
      }, 
        img({ 
          style: "width: 1.5rem;", 
          src: "/images/github-mark-white.svg", 
          alt: "project github" 
        })
      )
    )
  );
};

export const insertHeader = (activeMenu) => {
  const app = document.getElementById('app');
  const header = createHeader(activeMenu);
  // Insert header at the beginning instead of the end
  app.insertBefore(header, app.firstChild);
};
