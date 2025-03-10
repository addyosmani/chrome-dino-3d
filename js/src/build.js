"use strict";

// Function to dynamically import a module
async function dynamicImport(modulePath) {
  return import(`./${modulePath}`);
}

// First batch of imports
Promise.all([
  dynamicImport('input_manager.js'),
  dynamicImport('audio_manager.js'),
  dynamicImport('enemy_manager.js'),
  dynamicImport('score_manager.js'),
  dynamicImport('init.js'),
  dynamicImport('camera_controls.js'),
  dynamicImport('camera.js'),
  dynamicImport('light.js'),
  dynamicImport('particles.js')
]).then(async ([
  inputModule,
  audioModule,
  enemyModule,
  scoreModule,
  initModule,
  cameraControlsModule,
  cameraModule,
  lightModule,
  particlesModule
]) => {
  // Load log_manager and initialize logs
  const logModule = await dynamicImport('log_manager.js');
  let logs = new logModule.LogManager();
  if(config.logs) {
    logs.enable();
  }

  // Load player_manager and initialize player
  const playerModule = await dynamicImport('player_manager.js');
  let player = new playerModule.PlayerManager();

  // Load nature_manager and initialize nature
  const natureModule = await dynamicImport('nature_manager.js');
  let nature = new natureModule.NatureManager();

  // Load load_manager and initialize load_manager
  const loadManagerModule = await dynamicImport('load_manager.js');
  let load_manager = new loadManagerModule.LoadManager(); // start loading assets ASAP
  
  // Load assets
  await dynamicImport('assets.js');

  // Load effects_manager and initialize effects
  const effectsModule = await dynamicImport('effects_manager.js');
  let effects = new effectsModule.EffectsManager();

  // Load game_manager and interface_manager, initialize game
  const gameManagerModule = await dynamicImport('game_manager.js');
  const interfaceManagerModule = await dynamicImport('interface_manager.js');
  let game = new gameManagerModule.GameManager(new interfaceManagerModule.InterfaceManager());
  game.init(); // init game & interface ASAP
});