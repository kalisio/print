import { Plugin, Schema } from '@pdfme/common'
import { image } from '@pdfme/schemas'

// Interface
interface Map extends Schema {}
interface PostRobotListeners {
  kanoReady: any | null;
  layerShown: any | null;
  layerHidden: any | null;
}

// Environment variables for Kano and Gateway services
const KANO_URL = import.meta.env.VITE_KANO_URL
const KANO_JWT = import.meta.env.VITE_KANO_JWT
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL
const GATEWAY_JWT = import.meta.env.VITE_GATEWAY_JWT

// Default placeholder image
const defaultValue = 'data:image/png;base64,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';
// SVG icon for the map plugin
const locationIcon = '<svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="25px" height="25px" viewBox="0 0 395.71 395.71" xml:space="preserve"><g><path d="M197.849,0C122.131,0,60.531,61.609,60.531,137.329c0,72.887,124.591,243.177,129.896,250.388l4.951,6.738 c0.579,0.792,1.501,1.255,2.471,1.255c0.985,0,1.901-0.463,2.486-1.255l4.948-6.738c5.308-7.211,129.896-177.501,129.896-250.388 C335.179,61.609,273.569,0,197.849,0z M197.849,88.138c27.13,0,49.191,22.062,49.191,49.191c0,27.115-22.062,49.191-49.191,49.191 c-27.114,0-49.191-22.076-49.191-49.191C148.658,110.2,170.734,88.138,197.849,88.138z"/></g></svg>'

let layers: string[] = [];

// CSS styles for modal and spinner
const styles = `
  :root {
    --col1: #872341;
    --col2: #BE3144;
    --col3: #E17564;
  }
  .popup-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .popup-box {
    background: #fff;
    padding: 30px;
    border-radius: 12px;
    max-width: 850px;
    width: 90%;
    position: relative;
    animation: fadeInUp 0.3s ease;
  }
  .close-popup {
    position: absolute;
    top: 10px;
    right: 12px;
    background: none;
    border: none;
    font-size: 22px;
    cursor: pointer;
    color: #333;
  }
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .site-popups {
    position: relative;
    z-index: 999;
  }
  .spinner-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    pointer-events: auto;
  }
  .dots-spinner {
    width: 3.6rem;
    height: 3.4rem;
    position: relative;
    animation: spin 2s linear infinite;
  }
  .dots-spinner > span {
    display: block;
    --size: 1.2rem;
    height: var(--size);
    width: var(--size);
    background-color: var(--col1);
    border-radius: 50%;
    position: absolute;
    animation: pulse 3s ease-out infinite var(--delay), colorChange 4s linear infinite;
  }
  .dot-1 {
    top: 0;
    left: calc(50% - (var(--size) / 2));
    --delay: 2s;
  }
  .dot-2 {
    bottom: 0;
    left: 0;
    --delay: 1s;
  }
  .dot-3 {
    bottom: 0;
    right: 0;
    --delay: 0s;
  }
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
  @keyframes colorChange {
    0% { background-color: var(--col1); }
    33.33% { background-color: var(--col2); }
    66.66% { background-color: var(--col3); }
    100% { background-color: var(--col1); }
  }
  @keyframes spin {
    100% { transform: rotate(360deg); }
  }
`

// Converts an ArrayBuffer to a base64-encoded data URL
function arrayBufferToDataUrl (buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binary = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
  return `data:image/png;base64,${btoa(binary)}`;
}

// Creates the main container for the map plugin, displaying either a placeholder or the provided image
function createMapContainer (rootElement: HTMLElement, value: string, isDefault: boolean): HTMLElement {
  const container = document.createElement('div');
  const containerStyle: CSS.Properties = {
    width: '100%',
    height: '100%',
    backgroundImage: !value || isDefault ? `url(${defaultValue})` : 'none',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  };
  Object.assign(container.style, containerStyle);
  rootElement.appendChild(container);

  if (value && !isDefault) {
    const img = document.createElement('img');
    const imgStyle: CSS.Properties = {
      height: '100%',
      width: '100%',
      borderRadius: '0',
      objectFit: 'contain',
    };
    Object.assign(img.style, imgStyle);
    img.src = value;
    container.appendChild(img);
  }

  return container;
}

// Creates and configures the modal for Kano
function createModal (): { sitePopups: HTMLElement; modal: HTMLElement } {
  const sitePopups = document.createElement('div');
  sitePopups.className = 'site-popups';
  document.body.appendChild(sitePopups);

  const modal = document.createElement('div');
  modal.className = 'popup-modal';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="popup-overlay">
      <div class="popup-box">
        <button class="close-popup">×</button>
        <h2 class="popup-title">KANO</h2>
        <div class="popup-content" style="width: 800px; height: 600px;">
          <iframe
            id="kano"
            title="Kano"
            allow="geolocation *"
            frameBorder="0"
            style="width: 100%; height: 100%"
            src="${KANO_URL}"
          ></iframe>
        </div>
        <button class="validate-button" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          VALIDATE
        </button>
      </div>
    </div>
  `;
  sitePopups.appendChild(modal);

  return { sitePopups, modal };
}

// Creates and appends the CSS styles for the modal and spinner to the document head
function createStyles (): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = styles;
  document.head.appendChild(style);
  return style;
}

// Creates a trigger button to open the modal
function createTriggerButton (container: HTMLElement): HTMLButtonElement {
  const triggerButton = document.createElement('button');
  triggerButton.className = 'trigger-popup';
  triggerButton.style.cssText = 'width: 100%; height: 100%; opacity: 0; cursor: pointer; position: absolute;';
  container.appendChild(triggerButton);
  return triggerButton;
}

// Loads the post-robot library and sets up event listeners for Kano interactions
function loadPostRobot (listeners: PostRobotListeners): void {
  if (typeof window.postRobot === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/post-robot@10.0.42/dist/post-robot.min.js';
    script.async = true;
    script.onload = () => {
      listeners.kanoReady = window.postRobot.on('kano-ready', () => {
        const iframeWindow = document.getElementById('kano')?.contentWindow;
        if (iframeWindow && KANO_JWT) {
          window.postRobot.send(iframeWindow, 'setLocalStorage', { 'kano-jwt': KANO_JWT });
        }
      });

      listeners.layerShown = window.postRobot.on('layer-shown', (event) => {
        const layerName = event.data?.layer?.name;
        if (layerName) {
          layers.push(layerName);
        }
      });

      listeners.layerHidden = window.postRobot.on('layer-hidden', (event) => {
        const layerName = event.data?.layer?.name;
        if (layerName) {
          layers.splice(layers.indexOf(layerName), 1);
        }
      });
    };
    script.onerror = () => console.error('Failed to load post-robot script');
    document.head.appendChild(script);
  }
}

// Cleans up post-robot listeners and removes the script from the DOM
function cleanupPostRobot (listeners: PostRobotListeners): void {
  if (typeof window.postRobot !== 'undefined') {
    listeners.kanoReady?.cancel();
    listeners.layerShown?.cancel();
    listeners.layerHidden?.cancel();
    listeners.kanoReady = null;
    listeners.layerShown = null;
    listeners.layerHidden = null;
  }
  const scripts = document.querySelectorAll('script[src="https://cdn.jsdelivr.net/npm/post-robot@10.0.42/dist/post-robot.min.js"]');
  scripts.forEach(script => script.remove());
}

// Destroys the modal and associated resources
function destroyModal (sitePopups: HTMLElement, modal: HTMLElement, listeners: PostRobotListeners): void {
  modal.remove();
  sitePopups.remove();
  cleanupPostRobot(listeners);
}

// Creates and displays a full-screen spinner
function showSpinner (): HTMLElement {
  const spinnerOverlay = document.createElement('div');
  spinnerOverlay.className = 'spinner-overlay';
  spinnerOverlay.innerHTML = `
    <div class="dots-spinner">
      <span class="dot-1"></span>
      <span class="dot-2"></span>
      <span class="dot-3"></span>
    </div>
  `;
  document.body.appendChild(spinnerOverlay);
  return spinnerOverlay;
}

// Removes the spinner overlay from the DOM
function destroySpinner (spinnerOverlay: HTMLElement): void {
  spinnerOverlay.remove();
}

// Handles the modal close event by destroying the modal, showing a spinner, and fetching the map image
async function handleKanoModalClosed (
  event: Event,
  onChange: any,
  sitePopups: HTMLElement,
  modal: HTMLElement,
  listeners: PostRobotListeners,
  stopEditing: any
): Promise<void> {
  event.stopPropagation();
  destroyModal(sitePopups, modal, listeners);
  const spinnerOverlay = showSpinner();
  const endpoint = GATEWAY_URL + '/capture';
  const options = {
    method: 'POST',
    mode: 'cors' as RequestMode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      layers,
      bbox: [-18.43, 39.53, 23.72, 53.86],
      size: { width: 3590, height: 2633 },
      basePath: '/#/home/map'
    }),
  };
  if (GATEWAY_JWT) options.headers.Authorization = `Bearer ${GATEWAY_JWT}`

  try {
    const response = await fetch(endpoint, options);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const base64String = arrayBufferToDataUrl(buffer);
      if (onChange) {
        onChange({ key: 'content', value: base64String });
      }
    } else {
      console.error('Failed to fetch image:', response.statusText);
    }
  } catch (error) {
    console.error('Error fetching image:', error);
  } finally {
    stopEditing();
    layers = [];
    destroySpinner(spinnerOverlay);
  }
}

// Sets up a MutationObserver to clean up resources when the root element is removed
function setupCleanupObserver (
  rootElement: HTMLElement,
  sitePopups: HTMLElement,
  modal: HTMLElement,
  style: HTMLStyleElement,
  listeners: PostRobotListeners,
): void {
  const observer = new MutationObserver(() => {
    if (!document.contains(rootElement)) {
      modal.remove();
      sitePopups.remove();
      style.remove();
      cleanupPostRobot(listeners);
      layers = [];
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export const map: Plugin<Map> = {
  ui: async (arg) => {
    const { value, onChange, rootElement, mode, stopEditing } = arg
    const isEditable = mode === 'designer'
    const isDefault = value === defaultValue

    // Create the main container for the map
    const container = createMapContainer(rootElement, value, isDefault)
    if (isEditable) {
      // Initialize modal and styles
      const { sitePopups, modal } = createModal();
      const style = createStyles();
      const triggerButton = createTriggerButton(container);
      const listeners: PostRobotListeners = { kanoReady: null, layerShown: null, layerHidden: null };

      // Handle modal open
      triggerButton.addEventListener('click', () => {
        modal.style.display = 'block';
        loadPostRobot(listeners);
      });

      // Handle modal close via close button
      modal.querySelector('.close-popup')?.addEventListener('click', () => {
        destroyModal(sitePopups, modal, listeners);
        layers = [];
      });

      // Handle modal close via validate button
      modal.querySelector('.validate-button')?.addEventListener('click', (e) => {
        handleKanoModalClosed(e, onChange, sitePopups, modal, listeners, stopEditing);
      });

      // Setup cleanup observer for when rootElement is removed
      setupCleanupObserver(rootElement, sitePopups, modal, style, listeners);
    }
  },
  pdf: image.pdf,
  propPanel: {
    schema: {},
    defaultSchema: {
      name: '',
      type: 'map',
      content: '',
      position: { x: 0, y: 0 },
      width: 62.5,
      height: 37.5
    }
  },
  icon: locationIcon
}