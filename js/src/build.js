"use strict";

//= input_manager.js
//= audio_manager.js
//= enemy_manager.js
//= score_manager.js
//= init.js
//= camera_controls.js
//= camera.js
//= light.js
//= particles.js

//= log_manager.js
let logs = new LogManager();
if (config.logs) {
	logs.enable();
}

//= player_manager.js
let player = new PlayerManager();

//= nature_manager.js
let nature = new NatureManager();

//= load_manager.js
let load_manager = new LoadManager(); // start loading assets ASAP
//= geometry/ground.js
//= geometry/ground_bg.js
//= geometry/dyno.js
//= geometry/dyno_band.js
//= geometry/dyno_wow.js
//= geometry/cactus.js
//= geometry/ptero.js

//= geometry/rocks.js
//= geometry/flowers.js
//= geometry/misc.js

//= textures/ground.js

//= effects_manager.js
let effects = new EffectsManager();

//= game_manager.js
//= interface_manager.js