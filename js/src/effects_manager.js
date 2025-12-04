/**
 * Effects class.
 * Rain, day/night, etc.
 * @type {EffectsManager}
 */

class EffectsManager {
    constructor() {

      // day/night circle
      this.daytime = {
        "is_day": true,
        "duration": {
          "day": 60, // sec
          "night": 20, // sec
        },
        "transition": {
          "active": false,
          "duration": 5, // sec
          "step": 1 / 30, // times/sec
          "clock": new THREE.Clock()
        },
        "intensity": {
          "day": {
            "ambient": ALight.intensity,
            "direct": DLight.intensity,
            "shadow_radius": 1
          },
          "night": {
            "ambient": 0,
            "direct": .1,
            "shadow_radius": 10
          }
        },
        "fog": {
          "day": {
            "color": [.91, .70, .32]
          },
          "night": {
            "color": [.24, .40, .55]
          },
          "diff_cache": null
        },
        "background": {
          "day": {
            "color": [.91, .70, .32]
          },
          "night": {
            "color": [.24, .40, .55]
          },
          "diff_cache": null
        },
        "clock": new THREE.Clock()
      }

      // winter mode
      this.winter = {
        "is_active": false,
        "originalMaterialColors": new Map(), // Store original material colors
        "colors": {
          "fog": {
            "normal_day": [.91, .70, .32],
            "normal_night": [.24, .40, .55],
            "winter": [0.098, 0.463, 0.824] // Deep blue winter color (#1976D2)
          },
          "background": {
            "normal_day": [.91, .70, .32],
            "normal_night": [.24, .40, .55],
            "winter": [0.098, 0.463, 0.824] // Deep blue winter color (#1976D2)
          },
          "water": {
            "normal": 0x6EDFFF,
            "winter": 0x5AC8FA // Brighter blue for winter water
          }
        }
      }

      if(!config.renderer.effects) {
        this.update = function() {};
      }
    }

    changeDaytime(daytime = 'day') {
      this.daytime.is_day = daytime == 'day';

      // drop clock
      this.daytime.clock.stop();
      this.daytime.clock.elapsedTime = 0;
      this.daytime.clock.start();

      // reset values
      this.stepTransition(!this.daytime.is_day, 1, 1);
    }

    stepTransition(darken = true, step, total) {
      let inc = step / total;

      if(darken) {
        // to night
        if(inc === 1) {
          // set
          ALight.intensity = this.daytime.intensity.night.ambient;
          DLight.intensity = this.daytime.intensity.night.direct;

          scene.fog.color.setRGB(this.daytime.fog.night.color[0], this.daytime.fog.night.color[1], this.daytime.fog.night.color[2]);
          scene.background.setRGB(this.daytime.background.night.color[0], this.daytime.background.night.color[1], this.daytime.background.night.color[2]);
        
          DLight.shadow.radius = this.daytime.intensity.night.shadow_radius;
        } else {
          // step
          ALight.intensity = parseFloat((ALight.intensity - (this.daytime.intensity.day.ambient - this.daytime.intensity.night.ambient) * inc).toFixed(5));
          DLight.intensity = parseFloat((DLight.intensity - (this.daytime.intensity.day.direct - this.daytime.intensity.night.direct) * inc).toFixed(5));

          scene.fog.color.sub(this.daytime.fog.diff_cache);
          scene.background.sub(this.daytime.background.diff_cache);

          DLight.shadow.radius = parseFloat((DLight.shadow.radius - (this.daytime.intensity.night.shadow_radius - this.daytime.intensity.day.shadow_radius) * inc).toFixed(5));
        }
      } else {
        // to day
        if(inc === 1) {
          // set
          ALight.intensity = this.daytime.intensity.day.ambient;
          DLight.intensity = this.daytime.intensity.day.direct;

          scene.fog.color.setRGB(this.daytime.fog.day.color[0], this.daytime.fog.day.color[1], this.daytime.fog.day.color[2]);
          scene.background.setRGB(this.daytime.background.day.color[0], this.daytime.background.day.color[1], this.daytime.background.day.color[2]);
        
          DLight.shadow.radius = this.daytime.intensity.day.shadow_radius;
        } else {
          // inc
          ALight.intensity = parseFloat((ALight.intensity + (this.daytime.intensity.day.ambient - this.daytime.intensity.night.ambient) * inc).toFixed(5));
          DLight.intensity = parseFloat((DLight.intensity + (this.daytime.intensity.day.direct - this.daytime.intensity.night.direct) * inc).toFixed(5));

          scene.fog.color.add(this.daytime.fog.diff_cache);
          scene.background.add(this.daytime.background.diff_cache);
        
          DLight.shadow.radius = parseFloat((DLight.shadow.radius + (this.daytime.intensity.night.shadow_radius - this.daytime.intensity.day.shadow_radius) * inc).toFixed(5));
        }
      }

      this.daytime.transition.steps_done = parseFloat((this.daytime.transition.steps_done + step).toFixed(5));
    }

    startTransition(step, total) {
      let inc = step / total;

      this.daytime.transition.active = true; // begin transition
      this.daytime.transition.clock.elapsedTime = 0;
      this.daytime.transition.clock.start();
      this.daytime.transition.steps_done = 0;


      // cache sub & add colors
      this.daytime.fog.diff_cache = new THREE.Color();
      this.daytime.fog.diff_cache.setRGB(
        parseFloat((this.daytime.fog.day.color[0] - this.daytime.fog.night.color[0]) * inc),
        parseFloat((this.daytime.fog.day.color[1] - this.daytime.fog.night.color[1]) * inc),
        parseFloat((this.daytime.fog.day.color[2] - this.daytime.fog.night.color[2]) * inc)
      );

      this.daytime.background.diff_cache = new THREE.Color();
      this.daytime.background.diff_cache.setRGB(
        parseFloat((this.daytime.background.day.color[0] - this.daytime.background.night.color[0]) * inc),
        parseFloat((this.daytime.background.day.color[1] - this.daytime.background.night.color[1]) * inc),
        parseFloat((this.daytime.background.day.color[2] - this.daytime.background.night.color[2]) * inc)
      );
    }

    stopTransition() {
      this.daytime.transition.active = false; // end transition
      this.daytime.transition.clock.stop();
      this.daytime.transition.clock.elapsedTime = 0;
      this.daytime.transition.steps_done = 0;
    }

    reset() {
      this.stopTransition();
      this.changeDaytime('day');
      // Reset winter mode properly
      if (this.winter.is_active) {
        this.restoreOriginalMaterialColors();
        this.winter.is_active = false;
      } else {
        this.winter.originalMaterialColors.clear();
      }
    }

    toggleWinterMode() {
      this.winter.is_active = !this.winter.is_active;
      console.log('Winter mode toggled:', this.winter.is_active);
      this.applyWinterMode();
    }

    applyWinterMode() {
      if(this.winter.is_active) {
        // Apply winter colors
        scene.fog.color.setRGB(
          this.winter.colors.fog.winter[0],
          this.winter.colors.fog.winter[1],
          this.winter.colors.fog.winter[2]
        );
        scene.background.setRGB(
          this.winter.colors.background.winter[0],
          this.winter.colors.background.winter[1],
          this.winter.colors.background.winter[2]
        );

        // Update water color if water exists
        if(nature.water) {
          nature.water.material.color.setHex(this.winter.colors.water.winter);
        }

        // Apply winter filter to all scene objects
        this.applyWinterMaterialFilter();

        // Store original daytime colors and update them for winter
        if(!this.winter.originalDaytimeColors) {
          this.winter.originalDaytimeColors = {
            fog: {
              day: [...this.daytime.fog.day.color],
              night: [...this.daytime.fog.night.color]
            },
            background: {
              day: [...this.daytime.background.day.color],
              night: [...this.daytime.background.night.color]
            }
          };
        }

        // Set winter as both day and night color
        this.daytime.fog.day.color = [...this.winter.colors.fog.winter];
        this.daytime.fog.night.color = [...this.winter.colors.fog.winter];
        this.daytime.background.day.color = [...this.winter.colors.background.winter];
        this.daytime.background.night.color = [...this.winter.colors.background.winter];
      } else {
        // Restore normal colors
        if(this.winter.originalDaytimeColors) {
          this.daytime.fog.day.color = [...this.winter.originalDaytimeColors.fog.day];
          this.daytime.fog.night.color = [...this.winter.originalDaytimeColors.fog.night];
          this.daytime.background.day.color = [...this.winter.originalDaytimeColors.background.day];
          this.daytime.background.night.color = [...this.winter.originalDaytimeColors.background.night];
        } else {
          // Fallback to defaults
          this.daytime.fog.day.color = this.winter.colors.fog.normal_day;
          this.daytime.fog.night.color = this.winter.colors.fog.normal_night;
          this.daytime.background.day.color = this.winter.colors.background.normal_day;
          this.daytime.background.night.color = this.winter.colors.background.normal_night;
        }

        // Apply current daytime color
        if(this.daytime.is_day) {
          scene.fog.color.setRGB(this.daytime.fog.day.color[0], this.daytime.fog.day.color[1], this.daytime.fog.day.color[2]);
          scene.background.setRGB(this.daytime.background.day.color[0], this.daytime.background.day.color[1], this.daytime.background.day.color[2]);
        } else {
          scene.fog.color.setRGB(this.daytime.fog.night.color[0], this.daytime.fog.night.color[1], this.daytime.fog.night.color[2]);
          scene.background.setRGB(this.daytime.background.night.color[0], this.daytime.background.night.color[1], this.daytime.background.night.color[2]);
        }

        // Restore water color if water exists
        if(nature.water) {
          nature.water.material.color.setHex(this.winter.colors.water.normal);
        }

        // Restore original material colors
        this.restoreOriginalMaterialColors();
      }
    }

    applyWinterMaterialFilter() {
      // Validate scene exists
      if (typeof scene === 'undefined' || !scene) {
        console.warn('Scene not available for winter mode material filter');
        return;
      }
      
      // Traverse the scene and apply winter color filter to all materials
      scene.traverse((object) => {
        if (object.isMesh && object.material) {
          const material = object.material;
          
          // Skip if already processed
          if (this.winter.originalMaterialColors.has(material.uuid)) {
            return;
          }
          
          // Store original color
          if (material.color) {
            this.winter.originalMaterialColors.set(material.uuid, material.color.clone());
            
            // Apply winter color transformation
            // Convert greens/yellows to blues/whites, browns to grays
            const originalColor = material.color.clone();
            const h = {}; // hue, saturation, lightness
            originalColor.getHSL(h);
            
            // Winter color transformation logic:
            // - Greens (hue ~0.3) -> Blue-whites (hue ~0.55-0.65)
            // - Browns/yellows (hue ~0.1) -> Grays/blues (hue ~0.6)
            // - Reduce saturation for snowy/icy look
            // - Increase lightness for winter brightness
            
            let newHue = h.h;
            let newSat = h.s;
            let newLight = h.l;
            
            // Transform green hues (0.2-0.4) to blue-white hues (0.55-0.65)
            if (h.h >= 0.2 && h.h <= 0.4) {
              newHue = 0.55 + (h.h - 0.2) * 0.5; // Map to blue range
              newSat = h.s * 0.4; // Reduce saturation for icy look
              newLight = Math.min(1.0, h.l * 1.3 + 0.15); // Increase brightness
            }
            // Transform yellow/brown hues (0.05-0.2) to blue-gray (0.55-0.6)
            else if (h.h >= 0.05 && h.h <= 0.2) {
              newHue = 0.58; // Blue-gray hue
              newSat = h.s * 0.3; // Desaturate
              newLight = Math.min(1.0, h.l * 1.2 + 0.1); // Lighten
            }
            // For other colors, desaturate and tint blue
            else {
              newSat = h.s * 0.5;
              newLight = Math.min(1.0, h.l * 1.15 + 0.05);
              // Slightly shift hue toward blue
              newHue = h.h + (0.6 - h.h) * 0.3;
            }
            
            material.color.setHSL(newHue, newSat, newLight);
          }
        }
      });
    }

    restoreOriginalMaterialColors() {
      // Validate scene exists
      if (typeof scene === 'undefined' || !scene) {
        console.warn('Scene not available for restoring material colors');
        return;
      }
      
      // Restore all original material colors
      scene.traverse((object) => {
        if (object.isMesh && object.material) {
          const material = object.material;
          const originalColor = this.winter.originalMaterialColors.get(material.uuid);
          
          if (originalColor) {
            material.color.copy(originalColor);
          }
        }
      });
      
      // Clear the stored colors
      this.winter.originalMaterialColors.clear();
    }

    pause() {
      this.pause_time = this.daytime.clock.getElapsedTime();
      this.daytime.clock.stop();

      if( this.daytime.transition.active ) {
        this.pause_transition_time = this.daytime.transition.clock.getElapsedTime();
        this.daytime.transition.clock.stop();
      }
    }

    resume() {
      this.daytime.clock.start();
      this.daytime.clock.elapsedTime = this.pause_time;

      if( this.daytime.transition.active ) {
        this.daytime.transition.clock.start();
        this.daytime.transition.clock.elapsedTime = this.pause_transition_time;
      }
    }

    update(timeDelta) {
      if(this.daytime.is_day) {
        // day
        if(!this.daytime.transition.active) {
          // wait until night
          if(this.daytime.clock.getElapsedTime() > this.daytime.duration.day) {
            this.startTransition(this.daytime.transition.step, this.daytime.transition.duration);
          }
        } else {
          // transition to night
          if(this.daytime.transition.steps_done < this.daytime.transition.duration) {
            // step
            if(this.daytime.transition.clock.getElapsedTime() > (this.daytime.transition.step + this.daytime.transition.steps_done)) {
              this.stepTransition(true, this.daytime.transition.step, this.daytime.transition.duration);
            }
          } else {
            // end
            this.stopTransition();
            this.changeDaytime('night');
          }
        }
      } else {
        // night
        if(!this.daytime.transition.active) {
          // wait until day
          if(this.daytime.clock.getElapsedTime() > this.daytime.duration.night) {
            this.startTransition(this.daytime.transition.step, this.daytime.transition.duration);
          }
        } else {
          // transition to day
          if(this.daytime.transition.steps_done < this.daytime.transition.duration) {
            // step
            if(this.daytime.transition.clock.getElapsedTime() > (this.daytime.transition.step + this.daytime.transition.steps_done)) {
              this.stepTransition(false, this.daytime.transition.step, this.daytime.transition.duration);
            }
          } else {
            // end
            this.stopTransition();
            this.changeDaytime('day');
          }
        }
      }

      
    }
  }