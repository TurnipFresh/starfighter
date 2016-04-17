/// <reference path="../libs/dat.gui.js" />
/*
 * Game UI
 *
 * A class for handling the user interface of the gaming providing DOM element management and some helpers
 */

window.game = window.game || {};

window.game.ui = function () {
    var _ui = {};
    
    // Attributes
    _ui.elements = {};
    _ui.elements.infoboxIntro = null;

    // Some Object to be set by others for Hud Display State
    _ui.hud = {};
    
    // Methods
    // Methods
    _ui.init = function () {
        // Get DOM elements and bind events to them
        _ui.getElements();
        _ui.bindEvents();
    };

    _ui.destroy = function () {

    };

    _ui.getElements = function () {
        // Store the DOM elements in the elements object to make them accessible in addClass, removeClass and hasClass
        _ui.elements.infoboxIntro = document.querySelector("#infobox-intro");
    }

    _ui.bindEvents = function () {
        // Event bindings
        var gui = new dat.GUI();

        // Basic Display 
        for (var member in _ui.hud) {
            gui.add(text, member);
        }


    };

    _ui.fadeOut = function (element) {
        // Add a CSS class, fading is done via CSS3 transitions
        if (!_ui.hasClass(element, "fade-out")) {
            _ui.addClass(element, "fade-out");
        }
    };

    _ui.addClass = function (element, className, resetClassName) {
        // Adds a class to a specified element
        if (resetClassName && _ui.elements[element].getAttribute("data-classname")) {
            _ui.elements[element].className = resetClassName && _ui.elements[element].getAttribute("data-classname");
        }

        _ui.elements[element].className = _ui.elements[element].className + " " + className;
    };

    _ui.removeClass = function (element, className) {
        // Removes a class from a specified element
        var classNameRegEx = new RegExp("\\s\\b" + className + "\\b", "gi");
        _ui.elements[element].className = _ui.elements[element].className.replace(classNameRegEx, "");
    };

    _ui.hasClass = function (element, className) {
        // Checksif a specified element contains the given class name
        return _ui.elements[element].className.match(className);
    }

	return _ui;
};