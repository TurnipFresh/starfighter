/// <reference path="_references.js" />
/*
 * Game Models
 *
 * A collection of JSON game models that are stored as JSON Model format 3 for the use with THREE.js
 */

window.game = window.game || {};


var _player_model = function () {
    var self = {};
    // Attributes
    // Player entity including mesh and rigid body
    self.model = null,
    self.mesh = null,
    self.shape = null,
    self.rigidBody=  null,
    // Player mass which affects other rigid bodies in the world
    self.mass = 3;
    // HingeConstraint to limit player's air-twisting
    self.orientationConstraint = null;

    // Jump flags
    self.isGrounded = false;
    self.jumpHeight = 38;

    // Configuration for player speed (acceleration and maximum speed)
    self.speed = 1.5;
    self.speedMax = 45;
    // Configuration for player rotation (rotation acceleration and maximum rotation speed)
    self.rotationSpeed = 0.007;
    self.rotationSpeedMax = 0.04;
    // Rotation values
    self.rotationRadians = new THREE.Vector3(0, 0, 0);
    self.rotationAngleX = null;
    self.rotationAngleY = null;
    // Damping which means deceleration	(values between 0.8 and 0.98 are recommended)
    self.damping = 0.9;
    // Damping or easing for player rotation
    self.rotationDamping=  0.8;
    // Acceleration values
    self.acceleration = 0;
    self.rotationAcceleration = 0,
    // Enum for an easier method access to acceleration/rotation
    self.playerAccelerationValues = {
        position: {
            acceleration: "acceleration",
            speed: "speed",
            speedMax: "speedMax"
        },
        rotation: {
            acceleration: "rotationAcceleration",
            speed: "rotationSpeed",
            speedMax: "rotationSpeedMax"
        }
    };

    // Third-person camera configuration
    self.playerCoords = null,
    self.cameraCoords = null,
    // Camera offsets behind the player (horizontally and vertically)
    self.cameraOffsetH = 0,
    self.cameraOffsetV = 400,
    // Keyboard configuration for game.events.js (controlKeys must be associated to game.events.keyboard.keyCodes)
    self.controlKeys = {
        forward: "w",
        backward: "s",
        left: "a",
        right: "d",
        jump: "space"
    };
    // Methods
    self.create = function () {
       
        
        // Create a global physics material for the player which will be used as ContactMaterial for all other objects in the level
        window.game.cannon.playerPhysicsMaterial = new CANNON.Material("playerMaterial");

        // Create a player character based on an imported 3D model that was already loaded as JSON into game.models.player
        self.model = window.game.three.createModel(window.game.models.player, 12, [
            new THREE.MeshLambertMaterial({ color: window.game.static.colors.cyan, shading: THREE.FlatShading }),
            new THREE.MeshLambertMaterial({ color: window.game.static.colors.green, shading: THREE.FlatShading })
        ]);

        // Create the shape, mesh and rigid body for the player character and assign the physics material to it
        self.shape = new CANNON.Box(self.model.halfExtents);
        self.rigidBody = new CANNON.RigidBody(self.mass, self.shape, window.game.cannon.createPhysicsMaterial(window.game.cannon.playerPhysicsMaterial));
        self.rigidBody.position.set(0, 0, 50);
        self.mesh = window.game.cannon.addVisual(self.rigidBody, null, self.model.mesh);

        // Create a HingeConstraint to limit player's air-twisting - this needs improvement
        self.orientationConstraint = new CANNON.HingeConstraint(self.rigidBody, new CANNON.Vec3(0, 0, 0), new CANNON.Vec3(0, 0, 1), self.rigidBody, new CANNON.Vec3(0, 0, 1), new CANNON.Vec3(0, 0, 1));
        window.game.cannon.world.addConstraint(self.orientationConstraint);

        self.rigidBody.postStep = function () {
            // Reset player's angularVelocity to limit possible exceeding rotation and
            self.rigidBody.angularVelocity.z = 0;

            // update player's orientation afterwards
            self.updateOrientation();
        };

        // Collision event listener for the jump mechanism
        self.rigidBody.addEventListener("collide", function (event) {
            // Checks if player's is on ground
            if (!self.isGrounded) {
                // Ray intersection test to check if player is colliding with an object beneath him
                self.isGrounded = (new CANNON.Ray(self.mesh.position, new CANNON.Vec3(0, 0, -1)).intersectBody(event.contact.bi).length > 0);
            }
        });
    }

    self.update = function () {
        // Basic game logic to update player and camera
        self.processUserInput();
        self.accelerate();
        self.rotate();
        self.updateCamera();

        // Level-specific logic
        self.checkGameOver();
    }

    self.updateCamera = function () {
        // Calculate camera coordinates by using Euler radians from player's last rotation
        self.cameraCoords = window.game.helpers.polarToCartesian(self.cameraOffsetH, self.rotationRadians.z);

        // Apply camera coordinates to camera position
        window.game.three.camera.position.x = self.mesh.position.x + self.cameraCoords.x;
        window.game.three.camera.position.y = self.mesh.position.y + self.cameraCoords.y;
        window.game.three.camera.position.z = self.mesh.position.z + self.cameraOffsetV;

        // Place camera focus on player mesh
        window.game.three.camera.lookAt(self.mesh.position);
    }

    self.updateAcceleration = function (values, direction) {
        // Distinguish between acceleration/rotation and forward/right (1) and backward/left (-1)
        if (direction === 1) {
            // Forward/right
            if (self[values.acceleration] > -self[values.speedMax]) {
                if (self[values.acceleration] >= self[values.speedMax] / 2) {
                    self[values.acceleration] = -(self[values.speedMax] / 4);
                } else {
                    self[values.acceleration] -= self[values.speed];
                }
            } else {
                self[values.acceleration] = -self[values.speedMax];
            }
        } else {
            // Backward/left
            if (self[values.acceleration] < self[values.speedMax]) {
                if (self[values.acceleration] <= -(self[values.speedMax] / 2)) {
                    self[values.acceleration] = self[values.speedMax] / 4;
                } else {
                    self[values.acceleration] += self[values.speed];
                }
            } else {
                self[values.acceleration] = self[values.speedMax];
            }
        }
    }

    self.processUserInput = function () {
        // Jump
        if (window.game.events.keyboard.pressed[self.controlKeys.jump]) {
            self.jump();
        }

        // Movement: forward, backward, left, right
        if (window.game.events.keyboard.pressed[self.controlKeys.forward]) {
            self.updateAcceleration(self.playerAccelerationValues.position, 1);

            // Reset orientation in air
            if (!window.game.cannon.getCollisions(self.rigidBody.index)) {
                self.rigidBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), self.rotationRadians.z);
            }
        }

        if (window.game.events.keyboard.pressed[self.controlKeys.backward]) {
            self.updateAcceleration(self.playerAccelerationValues.position, -1);
        }

        if (window.game.events.keyboard.pressed[self.controlKeys.right]) {
            self.updateAcceleration(self.playerAccelerationValues.rotation, 1);
        }

        if (window.game.events.keyboard.pressed[self.controlKeys.left]) {
            self.updateAcceleration(self.playerAccelerationValues.rotation, -1);
        }
    }

    self.accelerate = function () {
        // Calculate player coordinates by using current acceleration Euler radians from player's last rotation
        self.playerCoords = window.game.helpers.polarToCartesian(self.acceleration, self.rotationRadians.z);

        // Set actual XYZ velocity by using calculated Cartesian coordinates
        self.rigidBody.velocity.set(self.playerCoords.x, self.playerCoords.y, self.rigidBody.velocity.z);

        // Damping
        if (!window.game.events.keyboard.pressed[self.controlKeys.forward] && !window.game.events.keyboard.pressed[self.controlKeys.backward]) {
            self.acceleration *= self.damping;
        }
    }

    self.rotate = function () {
        // Rotate player around Z axis
        window.game.cannon.rotateOnAxis(self.rigidBody, new CANNON.Vec3(0, 0, 1), self.rotationAcceleration);

        // Damping
        if (!window.game.events.keyboard.pressed[self.controlKeys.left] && !window.game.events.keyboard.pressed[self.controlKeys.right]) {
            self.rotationAcceleration *= self.rotationDamping;
        }
    }

    self.jump = function () {
        // Perform a jump if player has collisions and the collision contact is beneath him (ground)
        if (window.game.cannon.getCollisions(self.rigidBody.index) && self.isGrounded) {
            self.isGrounded = false;
            self.rigidBody.velocity.z = self.jumpHeight;
        }
    }

    self.updateOrientation = function () {
        // Convert player's Quaternion to Euler radians and save them to self.rotationRadians
        self.rotationRadians = new THREE.Euler().setFromQuaternion(self.rigidBody.quaternion);

        // Round angles
        self.rotationAngleX = Math.round(window.game.helpers.radToDeg(self.rotationRadians.x));
        self.rotationAngleY = Math.round(window.game.helpers.radToDeg(self.rotationRadians.y));

        // Prevent player from being upside-down on a slope - this needs improvement
        if ((window.game.cannon.getCollisions(self.rigidBody.index) &&
            ((self.rotationAngleX >= 90) ||
                (self.rotationAngleX <= -90) ||
                (self.rotationAngleY >= 90) ||
                (self.rotationAngleY <= -90)))
            ) {
            // Reset orientation
            self.rigidBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), self.rotationRadians.z);
        }
    };

    self.checkGameOver = function () {
        // Example game over mechanism which resets the game if the player is falling beneath -800
        if (self.mesh.position.z <= -800) {
            self.destroy();
        }
    }

    return self;
};

var __models = {
	player: {
		"metadata" :
		{
			"formatVersion" : 3.1,
			"generatedBy"   : "Blender 2.65 Exporter",
			"vertices"      : 56,
			"faces"         : 52,
			"normals"       : 56,
			"colors"        : 0,
			"uvs"           : [],
			"materials"     : 1,
			"morphTargets"  : 0,
			"bones"         : 0
		},
		"scale" : 1.000000,
		"materials" : [	{
			"DbgColor" : 15658734,
			"DbgIndex" : 0,
			"DbgName" : "cyan",
			"blending" : "NormalBlending",
			"colorAmbient" : [0.039546236395835876, 0.9822506308555603, 0.6938718557357788],
			"colorDiffuse" : [0.039546236395835876, 0.9822506308555603, 0.6938718557357788],
			"colorSpecular" : [1.0, 1.0, 1.0],
			"depthTest" : true,
			"depthWrite" : true,
			"shading" : "Lambert",
			"specularCoef" : 50,
			"transparency" : 1.0,
			"transparent" : false,
			"vertexColors" : false
		},
		{
			"DbgColor" : 15597568,
			"DbgIndex" : 1,
			"DbgName" : "green",
			"blending" : "NormalBlending",
			"colorAmbient" : [0.004776954650878906, 0.708375871181488, 0.2622506618499756],
			"colorDiffuse" : [0.004776954650878906, 0.708375871181488, 0.2622506618499756],
			"colorSpecular" : [1.0, 1.0, 1.0],
			"depthTest" : true,
			"depthWrite" : true,
			"shading" : "Lambert",
			"specularCoef" : 50,
			"transparency" : 1.0,
			"transparent" : false,
			"vertexColors" : false
		}],
		"vertices" : [0.205423,0.203889,0.163399,0.205423,0.203889,-0.163399,-0.836746,-0.0273734,0.0852706,-0.836746,-0.0273734,-0.0852706,0.00547919,0.231254,0.105459,0.00547919,0.231253,-0.105459,-0.667144,0.0819949,0.0550342,-0.667144,0.0819949,-0.0550342,-0.539983,-0.13177,0.198399,-0.539983,-0.13177,-0.198399,0.734445,-0.132315,-0.26534,0.734445,-0.132315,0.26534,0.205423,0.203889,0.163399,0.205423,0.203889,-0.163399,0.734445,0.14159,-0.194793,0.734445,0.14159,0.194793,-0.836746,-0.109792,0.0852706,-0.836746,-0.109792,-0.0852706,-0.836746,-0.0273734,0.0852706,-0.836746,-0.0273734,-0.0852706,0.817604,-0.0864622,-0.174778,0.817604,-0.0864621,0.174778,0.817604,0.0957368,-0.174778,0.817604,0.0957368,0.174778,0.817604,-0.0864621,-0.102738,0.817604,-0.0864621,0.102738,0.817604,0.0957368,-0.102738,0.817604,0.0957368,0.102738,0.256034,-0.0825444,-0.119579,0.256034,-0.0825444,0.119579,0.256034,0.101471,-0.119579,0.256034,0.101471,0.119579,-0.0492363,0.0232588,0.36925,-0.0492363,0.0232588,-0.36925,0.686899,-0.0452344,-0.355008,0.686899,-0.0452344,0.355008,0.11323,0.0768929,0.376715,0.11323,0.0768929,-0.376715,0.686899,0.0571518,-0.355008,0.686899,0.0571518,0.355008,0.418567,-0.0924264,0.793526,0.418567,-0.0924264,-0.793526,0.785102,-0.0793208,-0.790767,0.785102,-0.0793208,0.790767,0.418567,-0.077483,0.793526,0.418567,-0.0774831,-0.793526,0.785102,-0.0558296,-0.790767,0.785102,-0.0558296,0.790767,0.261471,0.197289,0.100715,0.261471,0.197289,-0.100715,0.678397,0.14819,-0.120066,0.678397,0.14819,0.120066,0.526158,0.323654,0.02321,0.526158,0.323654,-0.02321,0.85976,0.274555,-0.0276693,0.85976,0.274555,0.0276693],
		"morphTargets" : [],
		"normals" : [0.78103,0.039796,-0.623218,-0.769738,-0.313486,-0.556047,-0.333659,0.836451,-0.434706,-0.105533,0.891568,-0.440413,-0.105533,0.891568,0.440413,-0.333659,0.836451,0.434706,0.78103,0.039796,0.623218,-0.769738,-0.313486,0.556047,-0.224982,-0.534013,0.814966,-0.074679,0.965636,0.248848,-0.624805,0.646779,0.4373,-0.726859,-0.446181,0.52205,-0.421155,0.163549,0.892087,-0.225135,0.868618,0.441328,0.471755,-0.708945,0.524186,0.471755,-0.708945,-0.524186,0.842586,-0.402997,-0.357219,0.842586,-0.402997,0.357219,0.458266,0.80108,0.384991,0.648396,0.665242,0.370128,0.720054,-0.608722,0.33311,-0.224982,-0.534013,-0.814966,0.240608,0.900571,0.362011,0.000824,0.996063,0.088534,-0.624805,0.646779,-0.4373,-0.726859,-0.446181,-0.52205,-0.074679,0.965636,-0.248848,0.813654,-0.366131,0.451521,0.813654,-0.366131,-0.451521,0.819208,0.418744,0.391797,0.458266,0.80108,-0.384991,0.819208,0.418744,-0.391797,0.571184,0.573595,0.587115,0.571184,0.573595,-0.587115,0.487442,0.607013,-0.627613,0.487442,0.607013,0.627613,0.566759,-0.578936,0.586138,0.566759,-0.578936,-0.586138,0.665456,0.488449,0.564379,0.628651,-0.604236,0.489547,0.648396,0.665242,-0.370128,0.720054,-0.608722,-0.33311,0.628651,-0.604236,-0.489547,0.665456,0.488449,-0.564379,-0.225135,0.868618,-0.441328,-0.421155,0.163549,-0.892087,-0.127781,0.7163,-0.685965,-0.241432,-0.530503,-0.812555,-0.127781,0.7163,0.685965,-0.241432,-0.530503,0.812555,0.864315,0.221686,0.45143,-0.091922,0.898251,0.429701,0.240608,0.900571,-0.362011,0.000824,0.996063,-0.088534,0.864315,0.221686,-0.45143,-0.091922,0.898251,-0.429701],
		"colors" : [],
		"uvs" : [],
		"faces" : [35,1,3,7,5,0,0,1,2,3,35,4,5,7,6,0,4,3,2,5,35,0,1,5,4,0,6,0,3,4,35,2,0,4,6,0,7,6,4,5,35,3,2,6,7,0,1,7,5,2,35,0,2,3,1,0,6,7,1,0,35,8,12,18,16,1,8,9,10,11,35,12,8,32,36,1,9,8,12,13,35,11,10,20,21,1,14,15,16,17,35,11,15,39,35,1,14,18,19,20,35,8,9,10,11,1,8,21,15,14,35,12,15,51,48,1,9,18,22,23,35,18,19,17,16,1,10,24,25,11,35,9,8,16,17,1,21,8,11,25,35,13,9,17,19,1,26,21,25,24,35,21,20,24,25,1,17,16,27,28,35,15,11,21,23,1,18,14,17,29,35,10,14,22,20,1,15,30,31,16,35,14,15,23,22,1,30,18,29,31,35,25,24,28,29,1,28,27,32,33,35,22,23,27,26,1,31,29,34,35,35,23,21,25,27,1,29,17,28,34,35,20,22,26,24,1,16,31,35,27,35,30,31,29,28,1,36,37,33,32,35,24,26,30,28,1,27,35,36,32,35,26,27,31,30,1,35,34,37,36,35,27,25,29,31,1,34,28,33,37,35,35,39,47,43,1,20,19,38,39,35,38,34,42,46,1,40,41,42,43,35,15,12,36,39,1,18,9,13,19,35,14,10,34,38,1,30,15,41,40,35,13,14,38,37,1,26,30,40,44,35,8,11,35,32,1,8,14,20,12,35,10,9,33,34,1,15,21,45,41,35,9,13,37,33,1,21,26,44,45,35,45,46,42,41,1,46,43,42,47,35,47,44,40,43,1,38,48,49,39,35,33,37,45,41,1,45,44,46,47,35,32,35,43,40,1,12,20,39,49,35,37,38,46,45,1,44,40,43,46,35,34,33,41,42,1,41,45,47,42,35,39,36,44,47,1,19,13,48,38,35,36,32,40,44,1,13,12,49,48,35,18,12,13,19,1,10,9,26,24,35,48,51,55,52,1,23,22,50,51,35,15,14,50,51,1,18,30,52,22,35,14,13,49,50,1,30,26,53,52,35,13,12,48,49,1,26,9,23,53,35,55,54,53,52,1,50,54,55,51,35,50,49,53,54,1,52,53,55,54,35,51,50,54,55,1,22,52,54,50,35,49,48,52,53,1,53,23,51,55],
		"bones" : [],
		"skinIndices" : [],
		"skinWeights" : [],
		"animation" : {}
	}
};

window.game.models = __models;