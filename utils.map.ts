import { cloneDeep } from "@pdfme/common"

// Environment variables for Kano and Gateway services
const KANO_URL = import.meta.env.VITE_KANO_URL
const KANO_JWT = import.meta.env.VITE_KANO_JWT
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL
const GATEWAY_JWT = import.meta.env.VITE_GATEWAY_JWT

/// ===================================================
//                UTILITY FONCTIONS
/// ===================================================

// Converts millimeters to pixels with DPI, enforcing min 256 and max 5000
function mmToPx (mm: number): number {
  // For now we fix it to the same use to perform screen display
  // as otherwise it causes some problems in Leaflet we have to tackle first
  const DPI = 100
  const px = Math.round(mm * (DPI / 25.4))
  if (px < 256) return 256
  if (px > 5000) return 5000
  return px
}

// Converts an ArrayBuffer to a base64-encoded data URL
function arrayBufferToDataUrl (buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const binary = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('')
  return `data:image/png;base64,${btoa(binary)}`
}

/// ===================================================
//                KANO MODAL
/// ===================================================

// Creates a trigger button to open the kano modal
export function createTriggerButton (container: HTMLElement): HTMLButtonElement {
  const button = document.createElement('button')
  button.style.cssText = 'width: 100%; height: 100%; opacity: 0; cursor: pointer; position: absolute; top: 0; left: 0;'
  container.appendChild(button)
  return button
}

// CSS styles for spinner
const spinnerStyle = `
  :root {
    --col1: #872341;
    --col2: #BE3144;
    --col3: #E17564;
  }
  .spinner_overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    pointer-events: auto;
  }
  .spinner_dots {
    width: 3.6rem;
    height: 3.4rem;
    position: relative;
    animation: spin 2s linear infinite;
  }
  .spinner_dots > span {
    display: block;
    --size: 1.2rem;
    height: var(--size);
    width: var(--size);
    background-color: var(--col1);
    border-radius: 50%;
    position: absolute;
    animation: pulse 3s ease-out infinite var(--delay), colorChange 4s linear infinite;
  }
  .spinner_dot1 {
    top: 0;
    left: calc(50% - (var(--size) / 2));
    --delay: 2s;
  }
  .spinner_dot2 {
    bottom: 0;
    left: 0;
    --delay: 1s;
  }
  .spinner_dot3 {
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
`
// CSS styles for modal
const kanoModalStyle = `
  .kano-modal {
    position: relative;
    z-index: 999;
  }
  .kano-modal_overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .kano-modal_container {
    background: #fff;
    padding: 30px;
    border-radius: 12px;
    max-width: 850px;
    width: 90%;
    position: relative;
    animation: fadeInUp 0.3s ease;
  }
  .kano-modal_close {
    position: absolute;
    top: 10px;
    right: 12px;
    background: none;
    border: none;
    font-size: 22px;
    cursor: pointer;
    color: #333;
  }
  .kano-modal_iframe {
    width: 800px;
    height: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .kano-modal_print {
    margin-top: 10px;
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
`

// Creates the modal for Kano
export function createKanoModal (width: number, height: number): { kanoModal: HTMLElement, style: HTMLStyleElement } {
  // Calculate proportional dimensions
  let finalWidth: number
  let finalHeight: number
  if (width >= height) {
    // Landscape mode: fixed width = 800px
    finalWidth = 800
    finalHeight = Math.round((height / width) * 800)
  } else {
    // Portrait mode: fixed height = 600px
    finalHeight = 600
    finalWidth = Math.round((width / height) * 600)
  }
  // HTML
  const kanoModal = document.createElement('div')
  kanoModal.className = 'kano-modal'
  document.body.appendChild(kanoModal)
  const modal = document.createElement('div')
  kanoModal.style.display = 'none'
  modal.innerHTML = `
    <div class="kano-modal_overlay">
      <div class="kano-modal_container">
        <button class="kano-modal_close">×</button>
        <div class="kano-modal_iframe">
          <iframe
            id="kano"
            title="Kano"
            allow="geolocation *"
            frameBorder="0"
            style="width:${finalWidth}px; height:${finalHeight}px;"
            src="${KANO_URL}"
          ></iframe>
        </div>
        <button class="kano-modal_print">CAPTURE</button>
      </div>
    </div>
  `
  kanoModal.appendChild(modal)
  // Style
  const style = document.createElement('style')
  style.textContent = kanoModalStyle
  document.head.appendChild(style)
  // Script
  if (typeof window.postRobot === 'undefined') {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/post-robot@10.0.42/dist/post-robot.min.js'
    script.async = true
    script.onload = () => {
      window.postRobot.on('kano-ready', () => {
        const kanoIframe = document.getElementById('kano')?.contentWindow
        if (kanoIframe && KANO_JWT) window.postRobot.send(kanoIframe, 'setLocalStorage', { 'kano-jwt': KANO_JWT, 'kano-welcome': false, 'kano-install': false })
        postRobot.send(kanoIframe, 'setConfiguration', {
          'mapActivity.leftPane': { visible: false },
          'mapActivity.bottomPane': { visible: false },
          'mapActivity.fab': { visible: false },
          'mapActivity.topPane.filter': { id: { $in: ['locate-user', 'search-location'] }},
          'layout.panes.top': { opener: false, visible: true }
        })
      })
    }
    document.head.appendChild(script)
  }

  return { kanoModal, style }
}

// Destroys the kano modal and associated resources
export function destroyKanoModal (kanoModal: HTMLElement, style: HTMLStyleElement): void {
  kanoModal.remove()
  style.remove()
  const scripts = document.querySelectorAll('script[src="https://cdn.jsdelivr.net/npm/post-robot@10.0.42/dist/post-robot.min.js"]')
  scripts.forEach(script => script.remove())
  if (typeof window.postRobot !== 'undefined' && window.postRobot._listeners) window.postRobot.off('kano-ready')
}

/// ===================================================
//                SPINNER
/// ===================================================

// Creates and appends the CSS styles for the spinner to the document head
function createSpinnerStyles (): { spinner: HTMLElement, style: HTMLStyleElement } {
  // HTML
  const spinner = document.createElement('div')
  spinner.className = 'spinner_overlay'
  spinner.innerHTML = `
    <div class="spinner_dots">
      <span class="spinner_dot1"></span>
      <span class="spinner_dot2"></span>
      <span class="spinner_dot3"></span>
    </div>
  `
  document.body.appendChild(spinner)
  // CSS
  const style = document.createElement('style')
  style.textContent = spinnerStyle
  document.head.appendChild(style)

  return { spinner, style }
}

// Removes the spinner
function destroySpinner (spinner: HTMLElement, style: HTMLStyleElement): void {
  spinner.remove()
  style.remove()
}

/// ===================================================
//                PRINT
/// ===================================================

export async function print (
  kanoModal: HTMLElement,
  style: HTMLStyleElement,
  schema: object
): any {
  const { width, height } = schema
  // Get layers & bbox
  let layers: string[] = []
  let bbox: number[] = []
  const kano = document.getElementById('kano')?.contentWindow
  if (kano) {
    try {
      // Retrieve layers
      const layersResult = await window.postRobot.send(kano, 'map', { command: 'getLayers' })
      // Filter layers to include only names where isVisible is true
      layers = (layersResult.data || [])
        .filter((layer: { isVisible: boolean, name: string }) => layer.isVisible === true)
        .map((layer: { name: string }) => layer.name)
      // Retrieve bounds
      const boundsResult = await window.postRobot.send(kano, 'map', { command: 'getBounds' })
      const [[south, west], [north, east]] = boundsResult.data
      bbox = [west, south, east, north]
    } catch (error) {
      return ''
    }
  }

  // Detroy kano Modal
  destroyKanoModal(kanoModal, style)
  // Process print
  const mapPrinting = await processPrint(width, height, layers, bbox)
  return { mapPrinting, layers, bbox }
}

async function processPrint (
  width: number,
  height: number,
  layers: string[],
  bbox: number[]
): Promise<string> {
  const { spinner, style } = createSpinnerStyles()
  // Configure fetch options
  const endpoint = GATEWAY_URL + '/capture'
  const options = {
    method: 'POST',
    mode: 'cors' as RequestMode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      layers,
      bbox,
      layout: {
        panes: {
          bottom: { visible: false },
          left: { visible: false },
          right: { visible: false },
          top: { visible: false }
        },
        fab: { visible: false },
        stickies: { content: [] }
      },
      size: { width: mmToPx(width), height: mmToPx(height) },
      basePath: '/#/home/map'
    })
  }
  // Add JWT if available
  if (GATEWAY_JWT) options.headers.Authorization = `Bearer ${GATEWAY_JWT}`
  // Perform the request
  let print: string
  try {
    const response = await fetch(endpoint, options)
    if (response.ok) {
      const buffer = await response.arrayBuffer()
      print = arrayBufferToDataUrl(buffer)
    }
  } catch (error) {
    console.error('Error fetching image:', error)
  } finally {
    // Removes the spinner
    destroySpinner(spinner, style)
  }
  return print
}

export async function updatePluginMaps (designer: any) {
  const editedTemplate = designer.getTemplate()
  const merged = cloneDeep(editedTemplate)
  // Iterate through schemas
  for (const schemaArray of merged.schemas) {
    for (const schema of schemaArray) {
      if (schema.type === 'map') {
        try {
          // Print
          const print = await processPrint(
            schema.width,
            schema.height,
            schema.layers,
            schema.bbox
          )
          schema.content = print
        } catch (error) {
          console.error(`Error processing print for map schema "${schema.name}":`, error)
        }
      }
    }
  }
  designer.updateTemplate(merged)
}