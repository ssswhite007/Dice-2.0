
let config = {
    //Dice
    diceUrl: "./assets/dice/DefDice.glb",    
    selectionMeshUrl: "./assets/dice/DiceCollider.glb",
    selectionMeshScale: 1.1,
    diceScale: 1,
    environmentUrl: `./assets/env/PolyHaven.jpg`,
    floorTexture: './assets/tex/wood-018.jpg',
    floorRepeat: 3,
    
    //Camera stuff
    cameraPosition:[0,45,20],
    cameraLookAt:[0,0,0],
    //freeCamera:true,
    fov: 15,

    // physics
    restitution:  .75,  //How bouncy the dice are 0 to 1
    friction:  .01, // How much friction
    diceForce: 10, //Throwing force of dice...

    //Appearance:
    playFieldScale : 6, // Scale of walls relative to screen
    environmentRotation: [Math.PI,0,0], //Rotate the environment map/background

    //Bloom/glow
    bloomThreshold: .85,
    bloomStrength: .7,
    bloomRadius: 1.5,
    bloomExposure: 2.2,

    desiredResult: [1, 2, 3, 4, 5],

    diceModels: [
        "./assets/dice/DefDice.glb",
        "./assets/dice/BrassCore.glb",
        "./assets/dice/GemDiceH.glb",
    ]
    

    //Misc experiments
    //diceRoughness: .25,  // Dice roughness override
    //diceMetalness: .7,  // Dice metalness override
    //diceUrl:`./assets/shiba.glb`,
    //diceScale: .5,
    //diceUrl: `./assets/cube.glb`

}

import {Renderer} from "./renderer.js";
import {resetDice, CannonDice} from "./cannon-dice.js";

let {THREE, scene, camera, renderer, controls, ambientLight, directionalLight, events, gui, glbLoader, raycasting,postProcessing} = new Renderer(config);

if(config.bloomThreshold)postProcessing.params.bloomThreshold = config.bloomThreshold;
if(config.bloomStrength)postProcessing.params.bloomStrength = config.bloomStrength;
if(config.bloomRadius)postProcessing.params.bloomRadius = config.bloomRadius;
if(config.bloomExposure)postProcessing.params.bloomExposure = config.bloomExposure;

gui.hide();


import {SimpleDice} from "./simple-dice.js"
let simpleDice = await SimpleDice({THREE,renderer,scene,camera,glbLoader,raycasting,events,config})

var initialRender = (function () {
    var init = async function (dice1, dice2, dice3, dice4, dice5) {
        simpleDice.ChangeDesign(config.diceModels, 0, dice1);
        simpleDice.ChangeDesign(config.diceModels, 1, dice2);
        simpleDice.ChangeDesign(config.diceModels, 2, dice3);
        simpleDice.ChangeDesign(config.diceModels, 3, dice4);
        simpleDice.ChangeDesign(config.diceModels, 4, dice5);
        // config.refuelRenderer();
  };

  return {
    init: init,
  };
})();

var SettingMode = (function () {

  var initialize = async function () {
    // resetDice(simpleDice.cannonDice.diceArray);
    simpleDice.resetAllDice(simpleDice.cannonDice.initialPositions)
    document.querySelectorAll('#dice-to-house input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = false;
    });

  }


  var bindEvents = async function () {
    let hiliteUrl = config.selectionMeshUrl || `./assets/d6_hilight.glb`
    let hiliteGLB = await glbLoader.loadAsync(hiliteUrl);
    
    let selectionMesh = hiliteGLB.scene.children[0];
    selectionMesh.material.side = THREE.BackSide;
    selectionMesh.material.emissive.set(config.selectionEmissive || '#0f0')
    selectionMesh.material.blending = THREE.AdditiveBlending;
    selectionMesh.scale.multiplyScalar(config.selectionMeshScale||1.1);
    selectionMesh.position.set(0, 0, 0)
    $("#settingsButton").click(function () {
      $("#settingsMenu").toggle();
    });
    $("#resetButton").click(function () {
      initialize();
    });

    document.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.addEventListener("change", function () {
        let model = getSelectedDiceModel();
        initialRender.init(
          model.dice1,
          model.dice2,
          model.dice3,
          model.dice4,
          model.dice5
        );
      });
    });

    document.querySelectorAll('#throw-result input[type="number"]').forEach((input) => {
      input.addEventListener('change', function () {
        config.desiredResult = Array.from(document.querySelectorAll('#throw-result input[type="number"]')).map(input => parseInt(input.value, 10));
      });
    });

    document.querySelectorAll('input[name="hi-dice"]').forEach((input) => {
      input.addEventListener('change', function () {
        config.debugClicks = input.checked;
      });
    });

    document.querySelectorAll('#dice-to-house input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', function () {
        
        let cdice = simpleDice.cannonDice.diceArray;
        simpleDice.toggleDiceHold(cdice[input.value]);
      });
    });


  };

  var getSelectedDiceModel = function () {
    const selectedValues = {};

    for (let i = 1; i <= 5; i++) {
      const selectedDice = document.querySelector(
        `input[name="dice${i}"]:checked`
      );
      if (selectedDice) {
        if (selectedDice.value == "DefDice") selectedValues[`dice${i}`] = 0;
        if (selectedDice.value == "BrassCore") selectedValues[`dice${i}`] = 1;
        if (selectedDice.value == "Precious") selectedValues[`dice${i}`] = 2;
      } else {
        selectedValues[`dice${i}`] = 1; // No selection for this dice
      }
    }
    return selectedValues;
  };

  var init = function () {
    bindEvents();
  };

  return {
    init: init,
  };
})();

$(document).ready(function () {
  SettingMode.init();
});