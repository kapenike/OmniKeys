# OmniKeys
Create JavaScript keyboard shortcuts or detect keystroke chains with any key combination possible. Prevent default events under condition, or stop shortcuts from running when `keydown` inputs text to the DOM.

## Setup
Include `main.js` in your project

Create and modify your shortcuts within the `SHORTCUT_LIST` global variable. Currently stashed in the head of `main.js`

If you plan to dynamically load in this script or your shortcuts, I recommend disabling auto initialization by setting the global variable `INIT_BY_DEFAULT` to `false`. You can start or stop your shortcut listener with access to the OmniKeys global object `OmniKeys`

**Start listening for shortcuts with**

	OmniKeys.start()
	
*or*

**Stop listening with**

	OmniKeys.stop()
	
## Shortcut Setup
Shortcuts are defined as an array of objects. These objects currently accept 9 values:

* **hold** *required, but can be empty*
	* Key(s) required to be held for the shortcut to fire
	* **Type:** array of strings
	* **Accepts:** unmodified, standard and special keys  (see more under **Standard Keyboard Input**)
* **shortcut** *required*
	* Key(s) typed while the set of `hold` keys are true (a hold key is not required, although shortcut keys are)
	* **Type:** array of strings
	* **Accepts:** unmodified, standard and special keys
* **action** *required*
	* Function to call when shortcut has completed
	* **Type:** JavaScript function
	* **Accepts:** anything accessible from the global scope, the `Event` called at the final shortcut keystroke is passed to `action`
* *preventDefault*
	* Include to prevent default event on completion of shortcut key combination
	* **Type:** n/a, empty string used
* *preventDefaultAll*
	* Include to prevent default events while the current key combination is within the valid parameters of your shortcut. Also prevents default events on completion (this does not include key combinations that are only matched at a hold key level)
	* **Type:** n/a, empty string used
* *preventDefaultOnHold*
	* Include to prevent default event on completion of shortcut hold key combination
	* **Type:** n/a, empty string used
* *preventDefaultOnHoldAll*
	* Include to prevent default events while the current held key combination is within the valid shortcut hold key parameters. Also prevents default events on completion
	* **Type:** n/a, empty string used
* *predictInput*
	* Include to allow this shortcut to predict if the `input` event will fire. This overrides the default behavior of waiting for the DOM to confirm that an `input` event has fired
	* **Type:** n/a, empty string used
* *on_input*
	* Specify if a shortcut is allowed or required to run while user's keystroke is being input to the DOM. Default behavior is to 'not allow'.
	* **Type:** string
	* **Accepts:** `allow` or `require`
	
## Standard Keyboard Input
Any unmodified key stroke from your keyboard can be used ***examples:*** `a` `b` `y` `;` `]` `=` `` ` `` `/`. Note that backslash is accepted `\`, but you will need to escape it within your arrays.
An exception to this key stroke rule is the number pad, which you can find use cases for below.

Here is a list of all special cases for specifying keys in your shortcuts:

*Note: OmniKeys uses the keyboards `Event.code` value, if you have a special key not found here, you can simply use that code in your shortcut or create a range / single use case under the OmniKeys `decodeTypeCode` method.*

#### Keyboard Standards:
* Space
* Shift ~ split into left / right when `SHIFT_LR_SPECIFIC` is set to `true`
	* ShiftLeft
	* ShiftRight
* Control ~ split into left / right when `CTRL_LR_SPECIFIC` is set to `true`
	* ControlLeft
	* ControlRight
* Alt ~ split into left / right when `ALT_LR_SPECIFIC` is set to `true`
	* AltLeft
	* AltRight
* Tab
* CapsLock
* Escape
* F1 - F20
* Backspace
* Enter
* ContextMenu

#### Extended:
* ScrollLock
* Pause
* Insert
* Home
* PageUp
* PageDown
* End
* Delete
	
#### Arrow Keys:
* ArrowUp
* ArrowRight
* ArrowDown
* ArrowLeft
	
#### Number Pad:
* NumLock
* Numpad0 - Numpad9
* NumpadDecimal
* NumpadEnter
* NumpadAdd
* NumpadSubtract
* NumpadMultiply
* NumpadDivide
	 
## Examples

#### Ctrl + s
*If user holds control and presses "s" key, prevents default action*

	`
	{
		hold: ['Control'],
		shortcut: ['s'],
		action: function () { console.log('Save') },
		preventDefault: '',
	}
	`
	
#### Ctrl, s + hey
*If user holds control and s, then types "hey", prevents default save / history action*

	`
	{
		hold: ['Control','s'],
		shortcut: Array.from('hey'),
		action: function () { console.log('disable Ctrl + s default, but allow "hey" to be typed and then fire') },
		preventDefaultOnHold:'',
		preventDefaultAll:''
	}
	`
*Note: this shortcut requires all type shortcut defaults to be prevented (`preventDefaultAll`) as allowing the continuation of Ctrl + h to the DOM would open your history tab. Ctrl + s is disabled with `preventDefaultOnHold`*
	
#### Shift, a, z + hey
*If user holds Shift, a and z, then types "hey", the "hey" will continue to the DOM and shortcut will run*

	`
	{
		hold: ['Shift','a','z'],
		shortcut: Array.from('hey'),
		action: function () { console.log('Prevent Shift + a + z from being sent to the DOM, allow "hey" to be typed and then fire') },
		preventDefaultOnHoldAll:'',
		on_input: 'allow'
	}
	`
*Note: `preventDefaultOnHoldAll` is required to prevent a and z from being sent to the DOM. "hey" is sent to the DOM as there are is no `preventDefault(All)` option. However, this shortcut would be cancelled if activated while able to type in the DOM if we didn't have `on_input: 'allow'` included.*
	
#### Type: "/save", then "more"
*This captures when the user types `/save` into an input or `/savemore` anywhere (inclusive). This represents the ability to stack shortcuts*

	`
	{
		hold: [],
		shortcut: Array.from('/save'),
		action: function () { console.log('User typed "/save" into an input') },
		on_input: 'require'
	},
	{
		hold: [],
		shortcut: Array.from('/savemore'),
		action: function () { console.log('User followed that up with "more", typed anywhere') },
		on_input: 'allow'
	}
	`
	
#### predictInput vs Default Behavior
*This captures Ctrl + d, the Chrome default command for creating a shortcut. Using `predictInput`, we can have one shortcut run before the default action, and the other run after (default behavior)

	`
	{
		hold: ['Control'],
		shortcut: ['d'],
		action: function (e) { console.log('shortcut runs after default action') }
	},
	{
		hold: ['Control'],
		shortcut: ['d'],
		action: function (e) { console.log('shortcut runs before default action') },
		predictInput: ''
	}
	`
	
## ToDos
1. (ToDo) Create example application
