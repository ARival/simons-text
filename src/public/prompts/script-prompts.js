import van from "../van-1.5.5.min.js";
import { getImageTag } from "./prompts-render.js";
import { insertHeader } from "/js/components/header.js";
import { insertModal, setModalText, showModal, closeModal, setModalButtonsEnabled } from "/js/components/modal.js";

const { div, textarea, button, span, img } = van.tags;

insertHeader("prompt");
insertModal();

// Reactive state
const promptsState = van.state({
  cachedData: {},
  systemPrompt: "",
  actors: {},
  unsavedChanges: new Set(),
  searchTerm: "",
  filteredActors: {}
});

// Debounce function for search
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const updatePrompt = async (actorId) => {
  const promptTextarea = document.getElementById(`prompt-${actorId}`);
  const saveButton = promptTextarea.nextElementSibling;
  const container = promptTextarea.closest('.form-prompt-container');
  
  try {
    // Show loading state
    const spinner = saveButton.querySelector('.loading-spinner');
    if (spinner) {
      spinner.removeAttribute('hidden');
    }
    
    await fetch('/update-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actorId,
        prompt: promptTextarea.value
      })
    });
    
    // Update local state
    promptsState.val = {
      ...promptsState.val,
      actors: {
        ...promptsState.val.actors,
        [actorId]: {
          ...promptsState.val.actors[actorId],
          prompt: promptTextarea.value
        }
      }
    };
    
    // Remove from unsaved changes
    promptsState.val.unsavedChanges.delete(actorId);
    updateUnsavedIndicators();
    
    saveButton.setAttribute('hidden', true);
    container.classList.remove('has-changes');
    console.log('prompt updated');
  } catch (error) {
    console.error('Error updating prompt:', error);
  } finally {
    // Hide loading state
    const spinner = saveButton.querySelector('.loading-spinner');
    if (spinner) {
      spinner.setAttribute('hidden', true);
    }
  }
};

const updateSystemPrompt = async () => {
  const systemTextarea = document.getElementById('system-prompt-textarea');
  const saveButton = systemTextarea.nextElementSibling;
  
  try {
    await fetch('/update-system-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: systemTextarea.value
      })
    });
    
    promptsState.val = {
      ...promptsState.val,
      systemPrompt: systemTextarea.value
    };
    
    promptsState.val.unsavedChanges.delete('system');
    updateUnsavedIndicators();
    
    saveButton.setAttribute('hidden', true);
    console.log('system prompt updated');
  } catch (error) {
    console.error('Error updating system prompt:', error);
  }
};

const saveAllChanges = async () => {
  const saveAllButton = document.getElementById('save-all-button');
  
  try {
    setModalText(
      "Save All Changes",
      `Are you sure you want to save all ${promptsState.val.unsavedChanges.size} unsaved changes?`
    );
    
    const confirmAction = async () => {
      setModalButtonsEnabled(false);
      saveAllButton.disabled = true;
      
      // Save system prompt if changed
      if (promptsState.val.unsavedChanges.has('system')) {
        await updateSystemPrompt();
      }
      
      // Save all actor prompts
      for (const actorId of promptsState.val.unsavedChanges) {
        if (actorId !== 'system') {
          await updatePrompt(actorId);
        }
      }
      
      setModalButtonsEnabled(true);
      closeModal();
    };
    
    showModal(confirmAction);
  } catch (error) {
    console.error('Error saving all changes:', error);
    saveAllButton.disabled = promptsState.val.unsavedChanges.size === 0;
  }
};

window.updatePrompt = updatePrompt;
window.updateSystemPrompt = updateSystemPrompt;
window.saveAllChanges = saveAllChanges;

const compareTextareaToCached = (e) => {
  const isSystemPrompt = e.target.id === 'system-prompt-textarea';
  const actorId = isSystemPrompt ? 'system' : e.target.id.split('-')[1];
  const originalPrompt = isSystemPrompt 
    ? promptsState.val.systemPrompt 
    : promptsState.val.actors[actorId]?.prompt || "";
  
  const container = e.target.closest('.form-prompt-container') || e.target.closest('.system-prompt-container');
  const saveButton = e.target.nextElementSibling;
  
  if (e.target.value !== originalPrompt) {
    saveButton.removeAttribute('hidden');
    promptsState.val.unsavedChanges.add(actorId);
    if (container) container.classList.add('has-changes');
  } else {
    saveButton.setAttribute('hidden', true);
    promptsState.val.unsavedChanges.delete(actorId);
    if (container) container.classList.remove('has-changes');
  }
  
  updateUnsavedIndicators();
};

const updateUnsavedIndicators = () => {
  const saveAllButton = document.getElementById('save-all-button');
  const unsavedIndicator = document.getElementById('unsaved-changes');
  const count = promptsState.val.unsavedChanges.size;
  
  saveAllButton.disabled = count === 0;
  
  if (count > 0) {
    unsavedIndicator.removeAttribute('hidden');
    saveAllButton.textContent = `Save ${count} Change${count === 1 ? '' : 's'}`;
  } else {
    unsavedIndicator.setAttribute('hidden', true);
    saveAllButton.innerHTML = '<span>Save All Changes</span>';
  }
};

const filterActors = (searchTerm) => {
  if (!searchTerm.trim()) {
    promptsState.val = { 
      ...promptsState.val, 
      filteredActors: promptsState.val.actors 
    };
  } else {
    const filtered = {};
    const term = searchTerm.toLowerCase();
    
    Object.entries(promptsState.val.actors).forEach(([id, actor]) => {
      const matchesId = id.toLowerCase().includes(term);
      const matchesType = actor.type.toLowerCase().includes(term);
      const matchesPrompt = actor.prompt.toLowerCase().includes(term);
      
      if (matchesId || matchesType || matchesPrompt) {
        filtered[id] = actor;
      }
    });
    
    promptsState.val = { 
      ...promptsState.val, 
      filteredActors: filtered 
    };
  }
  
  renderPrompts();
};

const debouncedFilter = debounce(filterActors, 300);

const handleSearch = (e) => {
  promptsState.val = { 
    ...promptsState.val, 
    searchTerm: e.target.value 
  };
  debouncedFilter(e.target.value);
};

const createPromptContainer = (id, actor) => {
  return div({ class: "form-prompt-container" },
    div({ class: "form-prompt-header" },
      div({ 
        class: "form-prompt-image-container",
        innerHTML: getImageTag(actor.type)
      }),
      div({ class: "form-prompt-title" },
        span({ class: "form-prompt-address" }, `0x${id}`),
        span({ class: "form-prompt-actor-title" }, actor.type)
      )
    ),
    div({ class: "form-prompt-textarea-container" },
      textarea({ 
        id: `prompt-${id}`, 
        class: "form-prompt-textarea",
        placeholder: `Enter prompt for ${actor.type}...`,
        oninput: compareTextareaToCached,
        "aria-label": `Prompt for ${actor.type} actor`
      }, actor.prompt),
      button({ 
        class: "btn-icon prompt-save-button", 
        onclick: () => updatePrompt(id), 
        hidden: true,
        "aria-label": "Save prompt changes"
      }, 
        img({ src: "/images/save.svg", alt: "Save" }),
        div({ class: "loading-spinner", hidden: true })
      )
    )
  );
};

const renderPrompts = () => {
  const systemTextarea = document.getElementById('system-prompt-textarea');
  const promptsContainer = document.getElementById('prompts-container');
  const emptyState = document.getElementById('empty-state');
  const promptsCount = document.getElementById('prompts-count');
  
  // Update system prompt
  if (systemTextarea && systemTextarea.value !== promptsState.val.systemPrompt) {
    systemTextarea.value = promptsState.val.systemPrompt;
  }
  
  if (promptsContainer) {
    // Clear existing content
    promptsContainer.innerHTML = '';
    
    // Use filtered actors or all actors
    const actorsToRender = Object.keys(promptsState.val.filteredActors).length > 0 
      ? promptsState.val.filteredActors 
      : promptsState.val.actors;
    
    const actorCount = Object.keys(actorsToRender).length;
    const totalActors = Object.keys(promptsState.val.actors).length;
    
    // Update stats
    if (promptsCount) {
      if (promptsState.val.searchTerm && actorCount !== totalActors) {
        promptsCount.textContent = `${actorCount} of ${totalActors} actors`;
      } else {
        promptsCount.textContent = `${totalActors} actor${totalActors === 1 ? '' : 's'}`;
      }
    }
    
    // Show/hide empty state
    if (actorCount === 0) {
      if (promptsState.val.searchTerm) {
        emptyState.innerHTML = `
          <div class="empty-state-icon">🔍</div>
          <h3>No matches found</h3>
          <p>No actors match your search for "${promptsState.val.searchTerm}". Try a different search term.</p>
        `;
      }
      emptyState.removeAttribute('hidden');
      promptsContainer.setAttribute('hidden', true);
    } else {
      emptyState.setAttribute('hidden', true);
      promptsContainer.removeAttribute('hidden');
      
      // Add each actor prompt container
      Object.entries(actorsToRender).forEach(([id, actor]) => {
        const container = createPromptContainer(id, actor);
        van.add(promptsContainer, container);
      });
    }
  }
};

// Initialize prompts data
const initializePrompts = async () => {
  try {
    const response = await fetch('/prompts-list', { method: 'GET' });
    const data = await response.json();
    console.log(data);

    promptsState.val = {
      ...promptsState.val,
      cachedData: data,
      systemPrompt: data.system?.prompt || "",
      actors: data.actors || {},
      filteredActors: data.actors || {}
    };

    renderPrompts();
    setupEventListeners();
  } catch (error) {
    console.error('Error loading prompts:', error);
    // Show error state
    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
      emptyState.innerHTML = `
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to Load Prompts</h3>
        <p>There was an error loading the prompt data. Please refresh the page to try again.</p>
      `;
      emptyState.removeAttribute('hidden');
    }
  }
};

// Setup event listeners for new UI elements
const setupEventListeners = () => {
  // Search functionality
  const searchInput = document.getElementById('prompt-search');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
  
  // System prompt change detection
  const systemTextarea = document.getElementById('system-prompt-textarea');
  if (systemTextarea) {
    systemTextarea.addEventListener('input', compareTextareaToCached);
  }
  
  // Save all button
  const saveAllButton = document.getElementById('save-all-button');
  if (saveAllButton) {
    saveAllButton.addEventListener('click', saveAllChanges);
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (promptsState.val.unsavedChanges.size > 0) {
        saveAllChanges();
      }
    }
  });
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePrompts);
initializePrompts();