var INIT_BY_DEFAULT = true // start listening for shortcuts when script is loaded
var SHIFT_LR_SPECIFIC = false // separate left and right shift (requiring ShiftLeft or ShiftRight instead of just Shift)
var CTRL_LR_SPECIFIC = false // etc
var ALT_LR_SPECIFIC = false // etc

var SHORTCUT_LIST = []

var OmniKeys = new function OmniKeysListener() {
	this.hold_shortcut = {}
	this.active_keys = {}
	this.type_queue = []
	this.prevent_default = false
	this.prevent_default_on_hold = false
	
	// cases for a more user friendly shortcut input
	this.decodeTypeCode = (x) => {
		var len = x.length
		if (len == 4 && x.slice(0,3) == 'Key') {
			return x.slice(-1).toLowerCase()
		} else if (len == 6 && x.slice(0,5) == 'Digit') {
			return x.slice(-1)
		} else if (!SHIFT_LR_SPECIFIC && x.slice(0,5) == 'Shift') {
			return 'Shift'
		} else if (!CTRL_LR_SPECIFIC && x.slice(0,7) == 'Control') {
			return 'Control'
		} else if (!ALT_LR_SPECIFIC && x.slice(0,3) == 'Alt') {
			return 'Alt'
		} else {
			return {
				'Backquote': '`',
				'Slash': '/',
				'Minus': '-',
				'Equal': '=',
				'BracketLeft': '[',
				'BracketRight': ']',
				'Backslash': '\\',
				'Semicolon': ';',
				'Quote': '\'',
				'Comma': ',',
				'Period': '.',
				'Slash': '/'
			}?.[x] ?? x
		}
	}

	// detect if arrays match exactly
	this.arrMatch = (a,b) => {
		a = a.slice()
		b = b.slice()
		while (a.length == b.length && a.length > 0) {
			if (a.shift() == b[0]) {
				b.shift()
			}
		}
		return a.length == 0 && b.length == 0
	}
	
	// detect if target element can accept keystrokes
	this.predictInput = (e) => {
		return ['INPUT','TEXTAREA'].includes(e?.target.tagName)
			?	['text','password','date','datetime-local','email'].includes(e.target.type)
			: e?.isContentEditable
	}
	
	this.findMatchingHolds = (active_key_codes) => {
		// filter shortcuts based on active held keys
		return SHORTCUT_LIST.filter(x => {
			var decoded_held_keys = active_key_codes.map(y => this.decodeTypeCode(y))
			if (decoded_held_keys.length < x.hold.length) {
				// if partial match on hold keys, check for preventDefaultOnHoldAll if enabled
				if (this.arrMatch(x.hold.slice(0,decoded_held_keys.length),decoded_held_keys) && 'preventDefaultOnHoldAll' in x) {
					this.prevent_default_on_hold = true
				}
				return false
			}
			// if held keys match shortcut's hold keys, preventDefaultOnHold or preventDefaultOnHoldAll if enabled
			var held_keys_match = this.arrMatch(decoded_held_keys,x.hold)
			if (held_keys_match && ('preventDefaultOnHold' in x || 'preventDefaultOnHoldAll' in x)) {
				this.prevent_default_on_hold = true
			}
			return held_keys_match
		})
	}
	
	this.detectKeyMuddling = (active_key_codes,matched_by_hold) => {
		// if key(s) are held, but no hold matches are found and type_queue has more than 1 value
		if (active_key_codes.length > 0 && matched_by_hold.length == 0 && this.type_queue.length > 1) {
			// check to see if the previous type_queue value insert was muddled and stored in hold
			var held_key_location = active_key_codes.map(x => this.decodeTypeCode(x)).findIndex((x) => x == this.type_queue.at(-2))
			if (held_key_location > -1) {
				// if this is true, remove from active held keys and re-grab matching hold shortcuts
				active_key_codes.splice(held_key_location,1)
				var temp_matched_by_hold = this.findMatchingHolds(active_key_codes)
				// if the re-grab provides a matching shortcut by hold, we can assume the user is key muddling
				if (temp_matched_by_hold.length > 0) {
					matched_by_hold = temp_matched_by_hold
				}
			}
		}
		return matched_by_hold
	}
	
	this.findMatchingShortcuts = (matched_by_hold,e) => {
		return matched_by_hold.filter((x,i) => {
			// if type queue matches a type shortcut
			if (this.arrMatch(x.shortcut,this.type_queue)) {
				// predict if key stroke is within a typeable DOM element
				if ('predictInput' in x) {
					var input_prediction = this.predictInput(e)
					// if input and allowed or required, or not input and not required
					if ((input_prediction && (x?.on_input == 'allow' || x?.on_input == 'require')) || !input_prediction && x?.on_input != 'require') {
						x.action(e)
					}
				} else {
					// otherwise add to shortcut holder for post DOM input check
					// if allow, send null, otherwise send boolean based on if input is required
					this.hold_shortcut = {
						run_on_input: x?.on_input == 'allow' ? null : x?.on_input == 'require',
						action: setTimeout(x.action,0,e)
					}
				}
				if ('preventDefault' in x || 'preventDefaultAll' in x) {
					this.prevent_default = true
				}
				// Edge Case: if shortcut completes, disable on hold prevent default
				this.prevent_default_on_hold = false
				// remove matched shortcut from valid shortcut check
				return false
			}
			return this.arrMatch(x.shortcut.slice(0,this.type_queue.length),this.type_queue)
		})
	}
	
	this.resetPreventDefault = () => {
		this.prevent_default = false
		this.prevent_default_on_hold = false
	}
	
	this.keyDown = (e) => {
		this.resetPreventDefault()
		
		// held keys
		var active_key_codes = Object.keys(this.active_keys)
		
		// convert current key to decoded key
		var type_code = this.decodeTypeCode(e.code)
		
		// get shortcuts matching held keys
		var matched_by_hold = this.findMatchingHolds(active_key_codes)
		
		// predict if current key will prevent defaults on hold by adding it to hold match check; but not setting the return value for checking against shortcuts
		this.findMatchingHolds(active_key_codes.concat(e.code))
		
		// if key is held, do not add to type queue
		// if key is not held and type queue is empty, set to current key
		// otherwise, append current key to type queue
		this.type_queue = e.code in this.active_keys
			? this.type_queue
			: this.type_queue.length == 0
				? [type_code]
				: this.type_queue.concat(type_code)
				
		// detect key muddling
		matched_by_hold = this.detectKeyMuddling(active_key_codes,matched_by_hold)
		
		// get list of valid type shortcuts from held shortcut list
		var valid_shortcuts = this.findMatchingShortcuts(matched_by_hold,e)
		
		// if no valid shortcuts, reset type queue
		if (valid_shortcuts.length === 0) {
			this.type_queue = []
		} else if (valid_shortcuts.some(x => 'preventDefaultAll' in x)) {
			// otherwise check if any current valid shortcuts have preventDefaultAll
			this.prevent_default = true
		}
		
		// if current key isn't yet held
		if (typeof this.active_keys[e.code] === 'undefined') {
			// if type shortcut default isn't prevented and valid shortcuts are available, disable on hold prevention for this key stroke
			if (!this.prevent_default && valid_shortcuts.length > 0) {
				this.prevent_default_on_hold = false
			}
			// add current key to active held keys
			this.active_keys[e.code] = true
		}
		
		if (this.prevent_default || this.prevent_default_on_hold) {
			e.preventDefault()
		}
	}
	
	this.keyUp = (e) => {
		// remove key from active held keys
		delete this.active_keys[e.code]
	}
	
	this.input = (e) => {
		// if run_on_input is: null - allow to run regardless, true - run if is input, false - run if is not input
		if (this.hold_shortcut.run_on_input !== null) {
			if (e.constructor.name == 'InputEvent' && !this.hold_shortcut.run_on_input) {
				clearTimeout(this.hold_shortcut.run_on_input)
			}
		}
		this.hold_shortcut = {}
	}
	
	// if window loses focus, stop listening for shortcuts and reset held keys and type queue
	// add listener for when window re-gains focus
	this.reset = () => {
		this.stop()
		this.active_keys = {}
		this.type_queue = []
		window.addEventListener('focus', () => {
			this.start()
		}, { once: true })
	}
	
	this.start = () => {
		window.addEventListener('keydown', this.keyDown)
		window.addEventListener('keyup', this.keyUp)
		window.addEventListener('input', this.input)
		window.addEventListener('blur', this.reset)
	}
	this.stop = () => {
		window.removeEventListener('keydown', this.keyDown)
		window.removeEventListener('keyup', this.keyUp)
		window.removeEventListener('input', this.input)
		window.removeEventListener('blur', this.reset)
	}

	if (INIT_BY_DEFAULT) { this.start() }
}
