# OmniKeys
Create shortcuts with any key combination possible. Prevent default events under condition, or stop shortcuts from running when `keydown` affects the DOM

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
Shortcuts are defined as an array of objects. These objects currently accept 6 values:

* **hold** *required, but can be empty*
	* Key(s) required to be held for the shortcut to fire
	* **Type:** array of strings
	* **Accepts:** unmodified, standard qwerty and special keys  (see more under **Standard QWERTY Input**)
* **shortcut** *required*
	* Key(s) typed while the set of `hold` keys are true (a hold key is not required, although shortcut keys are)
	* **Type:** array of strings
	* **Accepts:** unmodified, standard qwerty and special keys
* **action** *required*
	* Function to call when shortcut has completed
	* **Type:** JavaScript function
	* **Accepts:** anything accessible from the global scope
* *preventDefault*
	* Include to prevent default event on completion of shortcut key combination
	* **Type:** n/a, empty string used
* *preventDefaultAll*
	* Include to prevent default events while the current key combination is within the valid parimeters of your shortcut. Also prevents default events on completion
	* **Type:** n/a, empty string used
* *allowDuringInput*
	* Include to allow this shortcut to fire even when its keystrokes affect the DOM
	* **Type:** n/a, empty string used
	
## Standard QWERTY Input
Any unmodified key stroke from your keyboard can be used ***examples:*** `a` `b` `y` `;` `]` `=` ````` `/`. Note that backslash is accepted `\`, but you will need to escape it within your arrays.
An acception to this key stroke rule is the number pad, which you can find use cases for below.

Here is a list of all special cases for specifying keys in your shortcuts:

#### QWERTY Standards:
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
* F1 - F12
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

##### Hold: Ctrl + Type: s
	`
	{
		hold: ['Control'],
		shortcut: ['s'],
		action: function () { console.log('Save') },
		preventDefault: '',
	}
	`
	
##### Hold: Ctrl, Shift, f + Type: . ; \
	`
	{
		hold: ['Control','Shift','f'],
		shortcut: ['.',';','\\',],
		action: function () { console.log('I hope this isn\t one of your shortcuts') }
	}
	`
	
##### Hold: Ctrl, s + Type: m
*This requires `preventDefaultAll` to stop default save event from firing while the shortcut isn't complete*
`
	{
		hold: ['Control','s'],
		shortcut: ['m'],
		action: function () { console.log('Expand on save command while preventing its default event') },
		preventDefaultAll: ''
	}
`
	
##### Type: /save
*This uses `allowDuringInput` to accept the shortcut while the user is typing. If `preventDefaultAll` was used in conjunction, the event would fire but no text would be output to the active DOM element*
`
	{
		hold: [],
		shortcut: Array.from('/save'),
		action: function () { console.log('User typed /save in a field or not') },
		allowDuringInput: ''
	}
`
	
## Bugs and ToDos
Theres a few, but I'm tired. If anyone happens to stumble across this between now and tomorrow ... here's whats up:
1. (Bug ... sorta) Type keys are converted to hold keys after the keydown event and removed when the keyup is fired. This all works great for hold keys but can bring an issue to the user when typing fast. When typing fast there is some overlap where two of these type keys are in keydown state at the same time. This creates a mismatch to the shortcut you're going for. Find some elegant way to detect when this occurs and keep type keys in the type queue ... this can't be done with `setTimout` or the script will lose access to its most valuable feature.
2. (ToDo) Add `predictInput` feature. Detect if event target is a DOM input. This would allow a shortcut like `Ctrl + s` that doesn't have its default event stopped to run its shortcut code before the default action occurs. Currently the default is to run directly after the following DOM update, so the shortcut code will run after the default action.
3. (ToDo) Add ability to restrict shortcut to only while users input is changing the DOM.
4. (ToDo) So much more
