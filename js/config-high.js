/**
 * Game Configuration
 * @type {Object}
 */
const config = {
  // Base configuration
  base_path: '/',
  logs: true,
  debug: false,
  
  // Camera settings
  camera: {
    fov: 45,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 200,
    controls: false,
    helper: false
  },
  
  // Renderer settings
  renderer: {
    // Display settings
    width: window.innerWidth,
    height: window.innerHeight,
    render_at: 1, // render resolution (lower = more fps at cost of quality)
    interval: false, // fps cap (false for no fps limit)
    fps_counter: true, // only works for fps cap

    // Graphics settings
    antialias: true, // AA
    shadows: true, // cast shadows
    shadows_type: THREE.PCFSoftShadowMap,
    fog: true, // show fog
    toneMapping: true, // enable tone mapping (Uncharted2)
    effects: true, // daytime, rain, etc
    
    // Post-processing
    postprocessing: {
      enable: false,
      sao: false, // Scaling Ambient Occlusion
    }
  },
  
  // Device detection
  IS_HIDPI: window.devicePixelRatio > 1,
  
  // iOS detection (iPads return "MacIntel" in iOS 13)
  IS_IOS: (/CriOS/.test(navigator.userAgent) ||
    (/iPad|iPhone|iPod|MacIntel/.test(navigator.platform) && 
     !(/Safari/.test(navigator.userAgent)))),
  
  // Mobile detection
  get IS_MOBILE() {
    return /Android/.test(navigator.userAgent) || this.IS_IOS;
  }
};
