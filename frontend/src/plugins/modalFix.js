// frontend/src/plugins/modalFix.js
import { createApp } from 'vue'

export function setupModalFix() {
  // Add global styles for modal centering
  const style = document.createElement('style')
  style.textContent = `
    /* Force proper modal centering */
    .v-application__wrap {
      position: relative !important;
    }
    
    .v-overlay-container {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 10000 !important;
      pointer-events: none !important;
    }
    
    .v-overlay__scrim {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 9999 !important;
      pointer-events: auto !important;
    }
    
    .v-overlay__content {
      position: relative !important;
      z-index: 10001 !important;
      pointer-events: auto !important;
      max-width: 90vw !important;
      max-height: 90vh !important;
      margin: auto !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    
    /* Dialog specific styles */
    .v-dialog {
      position: relative !important;
      margin: 24px !important;
      z-index: 10002 !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
      border-radius: 12px !important;
    }
    
    /* Ensure dialog content is properly contained */
    .v-dialog > .v-card {
      margin: 0 !important;
      width: 100% !important;
      border-radius: 12px !important;
      overflow: hidden !important;
    }
    
    /* Mobile specific adjustments */
    @media (max-width: 600px) {
      .v-dialog {
        width: calc(100% - 32px) !important;
        max-width: calc(100% - 32px) !important;
        margin: 16px !important;
        max-height: calc(100% - 32px) !important;
      }
      
      .v-overlay__content {
        padding: 16px !important;
      }
    }
    
    /* Fullscreen dialog on very small screens */
    @media (max-width: 400px) {
      .v-dialog:not(.v-dialog--fullscreen) {
        width: calc(100% - 24px) !important;
        margin: 12px !important;
      }
    }
  `
  document.head.appendChild(style)
}