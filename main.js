var INIT_BY_DEFAULT = true // start listener for shortcuts when script is loaded
var SHIFT_LR_SPECIFIC = false // separate left and right shift
var CTRL_LR_SPECIFIC = false // etc
var ALT_LR_SPECIFIC = false // etc

var SHORTCUT_LIST = [
	{
		hold: ['Control'],
		shortcut: ['s'],
		action: function () { console.log('Save!') },
		preventDefault: ''
	}
]

var OmniKeys = new function OmniKeysListener() {
	this.hold_shortcut = null
	this.active_keys = {}
	this.type_queue = []
	
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
			var check = a.shift()
			for (var i=0; i<b.length; i++) {
				if (check == b[i]) {
					b.splice(i,1)
					break
				}
			}
		}
		return a.length == 0 && b.length == 0
	}
	
	this.keyDown = (e) => {
		var prevent_default = false
		
		// held keys
		var active_key_codes = Object.keys(this.active_keys)
		
		// if no keys are held, check against all "no hold" shortcuts. Otherwise check held keys against shortcuts hold keys
		var matched_by_hold = active_key_codes.length == 0 ? SHORTCUT_LIST.filter(x => x.hold.length == 0) : SHORTCUT_LIST.filter(x => {
			var decoded_held_keys = active_key_codes.map(y => this.decodeTypeCode(y))
			if (decoded_held_keys.length != x.hold.length) {
				// if partial match on hold keys, don't pass along to type shortcuts but do preventDefaultAll if enabled
				if (this.arrMatch(x.hold.slice(0,decoded_held_keys.length),decoded_held_keys) && 'preventDefaultAll' in x) {
					prevent_default = true
				}
				return false
			}
			return this.arrMatch(decoded_held_keys,x.hold)
		})
		
		var type_code = this.decodeTypeCode(e.code)
		
		// if key is held, do not add to type queue
		// if key is not held and type queue is empty, set to current key
		// otherwise, append current key to type queue
		this.type_queue = e.code in this.active_keys
			? this.type_queue
			: this.type_queue.length == 0
				? [type_code]
				: this.type_queue.concat(type_code)
		
		// get list of valid type shortcuts from valid held / no hold shortcut list
		var is_valid_shortcut = matched_by_hold.filter((x,i) => {
			// if type queue matches a type shortcut
			if (this.arrMatch(x.shortcut,this.type_queue)) {
				// if allowed during input, call function now
				if ('allowDuringInput' in x) {
					x.action()
				} else {
					// otherwise add to shortcut holder to be removed if input event fires
					this.hold_shortcut = setTimeout(x.action,0)
				}
				if ('preventDefault' in x || 'preventDefaultAll' in x) { prevent_default = true }
				// remove matched shortcut from valid shortcut check
				return false
			}
			return this.arrMatch(x.shortcut.slice(0,this.type_queue.length),this.type_queue)
		})
		
		// if no valid shortcuts, reset type queue
		if (is_valid_shortcut.length === 0) {
			this.type_queue = []
		} else if (is_valid_shortcut.some(x => 'preventDefaultAll' in x)) {
			// otherwise check if any current valid shortcuts have preventDefaultAll
			prevent_default = true
		}
		
		// add current key to active held keys
		this.active_keys[e.code] = true
		
		if (prevent_default) {
			e.preventDefault()
		}
	}
	
	this.keyUp = (e) => {
		// remove key from active held keys
		delete this.active_keys[e.code]
	}
	
	// if holding action for input check, and InputEvent fires, cancel action and set action hold to null
	this.input = (e) => {
		if (this.hold_shortcut && e.constructor.name == 'InputEvent') {
			clearTimeout(this.hold_shortcut)
			this.hold_shortcut = null
		}
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
