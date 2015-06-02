/// <reference path="_references.js" />
/*
 * Game Events
 *
 * A basic input system for keyboard controls
 */

window.game = window.game || {};

var __events = function() {
	var _events = {
		// Attributes
		keyboard: {
			// Attributes

			// Will be used in game.core.player.controlKeys
			keyCodes: {
				32: "space",
				65: "a",
				68: "d",
				83: "s",
				87: "w"
			},
			// This object will contain the pressed key states in real-time
			pressed: {
				// Pressed key states
			},

			// Methods
			onKeyDown: function(event) {
				// Set the pressed state for a key
				_events.keyboard.pressed[_events.keyboard.keyCodes[event.keyCode]] = true;
				// Fire common onKeyDown event which can be set from outside
				_events.onKeyDown();
			},
			onKeyUp: function(event) {
				// Unset the pressed state for a key
				_events.keyboard.pressed[_events.keyboard.keyCodes[event.keyCode]] = false;
			}
		},
		mouse: {
		    click: function (event) {
		        event.preventDefault();
		        //projector.unprojectVector(vector, camera);
		        console.log(event);

		        var vector = new THREE.Vector3(
                                           (event.clientX / window.innerWidth) * 2 - 1,
                                         -(event.clientY / window.innerHeight) * 2 + 1,
                                           0.5
                                       );
		        game.three.projector = new THREE.Projector();
		        game.three.projector.unprojectVector(vector, game.three.camera);

		        if (game.camera !== undefined) {
		            var ray = new THREE.Ray(game.three.camera.position,
                                 vector.subSelf(game.three.camera.position).normalize());

		            var intersects = ray.intersectObjects(objects);

		            if (intersects.length > 0) {

		                intersects[0].object.materials[0].color.setHex(Math.random() * 0xffffff);

		                var particle = new THREE.Particle(particleMaterial);
		                particle.position = intersects[0].point;
		                particle.scale.x = particle.scale.y = 8;
		                game.three.scene.add(particle);

		                // Parse all the faces
		                for (var i in intersects) {
		                    intersects[i].face.material[0].color
                                .setHex(Math.random() * 0xffffff | 0x80000000);
		                }
		            }
		        }

		    }
		},
		// Methods
		init: function() {
			// Add the listeners
			document.addEventListener("keydown", _events.keyboard.onKeyDown, false);
			document.addEventListener("keyup", _events.keyboard.onKeyUp, false);
			document.addEventListener('mousedown', _events.mouse.click,  false);
		},
		onKeyDown: function() {
			// No specific actions by default
		}
	};

	return _events;
};

window.game.events = new __events();