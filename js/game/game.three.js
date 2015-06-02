/*
 * Game THREE.js module
 *
 * A class for the main THREE.js setup including camera, renderer and Cannon.js helpers
 */

window.game = window.game || {};


var _self = function() {
    var self = {};
		// Attributes

		// DOM container which will hold the final canvas element of THREE.js
    self.domContainer = null,
    // Camera size constraint to limit viewport e.g. for a user interface
    self.cameraSizeConstraint = null,
    // Scene, camera and renderer
    self.camera = null,
    self.scene = null,
    self.renderer = null,
    self.projector = new THREE.Projector(),
    // Field of view default setting for the camera
    self.fov = 45;

		// Methods
    self.init = function(options) {
        // Initialize the DOM container from the options or create a new one
        self.domContainer = options && options.domContainer || document.createElement("div");
        // Set camera size
        self.cameraSizeConstraint = {
            width: options && options.cameraSizeConstraint && options.cameraSizeConstraint.width || 0,
            height: options && options.cameraSizeConstraint && options.cameraSizeConstraint.height || 0
        };

        // Append new DOM container if needed
        if (!options || !options.domContainer) {
            document.body.appendChild(self.domContainer);
        }

        // Basic scene and lights setup
        self.setup();

        // Create the main perspective camera using default fov and camera size constraints
        self.camera = new THREE.PerspectiveCamera(self.fov, (window.innerWidth - self.cameraSizeConstraint.width) / (window.innerHeight - self.cameraSizeConstraint.height), 1, 15000);
        // Set the up vector to the Z axis so everything is aligned to the Cannon.js coordinate system
        self.camera.up.set(0, 0, 1);

            
            
        // Define default WebGL renderer
        self.renderer = new THREE.WebGLRenderer({ antialias: true });

        // Set the background color (HTML background will be used if this option is omitted)
        if (options && typeof options.rendererClearColor === "number") {
            self.renderer.setClearColor(options.rendererClearColor, 1);
        }

        self.projector = new THREE.Projector();
        console.log("Here");
        console.log(self.projector);

        // Add window resize listener to keep screen size for the canvas
        self.onWindowResize();
        window.addEventListener("resize", self.onWindowResize, false);

        // Append the canvas element
        self.domContainer.appendChild(self.renderer.domElement);
    };

    self.destroy = function() {

    };

    self.setup = function () {
        // Setup main scene
        self.scene = new THREE.Scene();

        // Call lights setup method defined in game.core.js if existing
        if (self.setupLights) {
            self.setupLights();
        }
    };

    self.render = function() {
        // Update the scene
        self.renderer.render(self.scene, self.camera);
    };
		
    self.onWindowResize = function() {
        // Keep screen size when window resizes
        self.camera.aspect = (window.innerWidth - self.cameraSizeConstraint.width) / (window.innerHeight - self.cameraSizeConstraint.height);
        self.camera.updateProjectionMatrix();
        self.renderer.setSize((window.innerWidth - self.cameraSizeConstraint.width), (window.innerHeight - self.cameraSizeConstraint.height));
    };

    self.createModel = function(jsonData, scale, materials, isGeometry) {
        // Variables for JSONLoader and imported model data
        var loader;
        var jsonModel;
        var meshMaterial;
        var model = {};

        // If isGeometry is set, the JSON model has already been loaded asynchronously and the geometry data is available here
        if (isGeometry) {
            jsonModel = jsonData;
        } else {
            // Regular model loading of JSON data that exists e.g. in game.models.js
            loader = new THREE.JSONLoader();
            jsonModel = loader.parse(JSON.parse(JSON.stringify(jsonData)));
        }

        // Create the Cannon.js geometry for the imported 3D model
        self.createCannonGeometry(jsonModel.geometry, scale);
        // Generate the halfExtents that are needed for Cannon.js
        model.halfExtents = self.createCannonHalfExtents(jsonModel.geometry);

        // Check if materials is set
        if (materials) {
            // If materials is an array, assign each material to the corresponding imported material
            if (typeof materials === "object" && materials.length) {
                // Iterate through the imported materials and
                if (jsonModel.materials) {
                    for (var i = 0; i < jsonModel.materials.length; i++) {
                        jsonModel.materials[i] = materials[i];
                    }

                    // Create a multi-face material
                    meshMaterial = new THREE.MeshFaceMaterial(jsonModel.materials);
                }
            } else {
                // Use and assign the defined material directly
                meshMaterial = materials;
            }
        } else {
            // Create a multi-face material
            if (jsonModel.materials) {
                meshMaterial = new THREE.MeshFaceMaterial(jsonModel.materials);
            }
        }

        // Assign the material(s) to the created mesh
        model.mesh = new THREE.Mesh(jsonModel.geometry, meshMaterial);

        // Return an object containing a mesh and its halfExtents
        return model;
    };

    self.createCannonGeometry = function(geometry, scale) {
        // Preparre translation properties
        var translateX;
        var translateY;
        var translateZ;

        // Get the bounding box for the provided geometry
        geometry.computeBoundingBox();

        // Center the imported model so the axis-aligned bounding boxes (AABB) and bounding spheres are generated correctly by Cannon.js
        translateX = -((geometry.boundingBox.size().x / 2) + geometry.boundingBox.min.x);
        translateY = -((geometry.boundingBox.size().y / 2) + geometry.boundingBox.min.y);
        translateZ = -((geometry.boundingBox.size().z / 2) + geometry.boundingBox.min.z);

        // Apply various matrix transformations to translate, rotate and scale the imported model for the Cannon.js coordinate system
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(translateX, translateY, translateZ));
        geometry.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2));
        geometry.applyMatrix(new THREE.Matrix4().makeScale(scale, scale, scale));
    };

    self.createCannonHalfExtents = function(geometry) {
        // The final bounding box also exsists so get its dimensions
        geometry.computeBoundingBox();

        // Return a Cannon vector to define the halfExtents
        return new CANNON.Vec3(
            (geometry.boundingBox.max.x - geometry.boundingBox.min.x) * 0.5,
            (geometry.boundingBox.max.y - geometry.boundingBox.min.y) * 0.5,
            (geometry.boundingBox.max.z - geometry.boundingBox.min.z) * 0.5
        );
    };

	return self;
};

window.game.three = new _self();