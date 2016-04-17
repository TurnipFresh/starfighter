/*
 * Game Events
 *
 * A basic input system for keyboard controls
 */

window.game = window.game || {};


window.game.events = function () {
    var _events = {};

    _events.keyboard = {};

    // Will be used in game.core.player.controlKeys
    _events.keyboard.keycodes = {};
    _events.keyboard.keycodes["32"] = "space";
    _events.keyboard.keycodes["65"] = "a";
    _events.keyboard.keycodes["68"] = "d";
    _events.keyboard.keycodes["83"] = "s";
    _events.keyboard.keycodes["87"] = "w";

    // This object will contain the pressed key states in real-time
    // Pressed key states
    _events.keyboard.pressed = {};

    _events.keyboard.onKeyDown = function (event) {
        _events.keyboard.pressed[_events.keyboard.keycodes[event.keyCode]] = true;
        // Fire common onKeyDown event which can be set from outside
        _events.onKeyDown();
    };

    _events.onKeyUp = function (event) {
        // Unset the pressed state for a key
        _events.keyboard.pressed[_events.keyboard.keyCodes[event.keyCode]] = false;
    };

    _events.init = function() {
        // Add the listeners
        document.addEventListener("keydown", _events.keyboard.onKeyDown, false);
        document.addEventListener("keyup", _events.keyboard.onKeyUp, false);
    };

    _events.onKeyDown = function () {
        // No specific actions by default

        // key down over rides
    };

	return _events;
};