/*
 * Game UI
 *
 * A class for handling the user interface of the gaming providing DOM element management and some helpers
 */

window.game = window.game || {};

var _ui = function() {
	var self = {
		// Attributes
		elements: {
			// Properties for DOM elements are stored here
			infoboxIntro: null
		},

		// Methods
		init: function () {
			// Get DOM elements and bind events to them
			self.getElements();
			self.bindEvents();
		},
		destroy: function () {

		},
		getElements: function () {
			// Store the DOM elements in the elements object to make them accessible in addClass, removeClass and hasClass
			self.elements.infoboxIntro = document.querySelector("#infobox-intro");
		},
		bindEvents: function () {
			// Event bindings
		},
		fadeOut: function (element) {
			// Add a CSS class, fading is done via CSS3 transitions
			if (!self.hasClass(element, "fade-out")) {
				self.addClass(element, "fade-out");
			}
		},
		addClass: function (element, className, resetClassName) {
			// Adds a class to a specified element
			if (resetClassName && self.elements[element].getAttribute("data-classname")) {
				self.elements[element].className = resetClassName && self.elements[element].getAttribute("data-classname");
			}

			//self.elements[element].className = self.elements[element].className + " " + className;
		},
		removeClass: function (element, className) {
           
			// Removes a class from a specified element
			var classNameRegEx = new RegExp("\\s\\b" + className + "\\b", "gi");
			self.elements[element].className = self.elements[element].className.replace(classNameRegEx, "");
		},
		hasClass: function (element, className) {
			// Checksif a specified element contains the given class name
			//return self.elements[element].className.match(className);
		}
	};

	return self;
};

window.game.ui = new _self();