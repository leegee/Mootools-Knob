/*
---
description: Rotary-knob input control with WIA-ARIA and keyboard support

license: MIT-style

authors:
- Lee Goddard

requires:
- Core 
- Element.Dimensions

provides: [Knob]

...
*/

// # MooKnob
//	Version 0.5 - degreesoffset, nearly got double-click support, 
//	Version 0.4 - Default pointer
//	Version 0.2 - WIA-ARIA and keyboard control Support
//
//	This code is copyright (C) 2012 Lee Goddard, Server-side Systems Ltd.
//	All Rights Reserved.
//	
//	Available under the same terms as Perl5.
//
//	Provides events:
//	
//		onMousedown - when the knob is clicked
//		onTick - every time the knob turns
//		onMouseup - when the knob is released


// ## Disgusting global variable
// Thhis horrible global variable seems to be necessary 
var __ActiveMooToolsKnobCtrl__ = null;

// ## Class definition
var Knob = new Class({
	Implements: [Options, Events],

// ### Options

	// Keep options lower-case for dataset compatability
	options: {						
		// DOM element or element ID, to replace with this control 
		element: 		null,		
		// Initial value of control: if not supplied, taken from attributes 'value' or 'data-value' 
		value:			0,			
		// Default is an up-arrow (↑). Text to add within knob element. If you set this to null, the up-arrow is not added to the knob element 
		addpointer:		'↑',	
		// Minimum and maximum values 		
		range:			[-100, 100], 
		// Multiplier applied to number of px moved, to acheive change in .value 
		scale:			1,			
		// When arrow keys control knob, incrase knob value by this 
		keychangeby:				1, 	
		// As keyUnit but for when shift key is also pressed 
		keychangebywithshift: 10, 	
		// Force all values to be integers 
		forceint:	false,			
		// May be a string or DOM element to monitor: changes in this elements *value* attribute will change the control's *value* attribute, and cause the control to be re-rendered. 
		monitor:		null, 			
		// Frequency of checking for monitor.value changes 
		monitorMs:	1000/4, 		
		// Adjusts rotation by degrees: changes the knob type from a pan control to a 0-10 control, for eample.
		degreesoffset:	0,
		
		// Fired when all processing is done, but for rotation the control by the value in `this.degrees`
		onTick:			function(){},
		// Fired when the main mouse button is depressed, but after processing
		onMousedown: 	function(){},
		// Fired when the main mouse button is released, but after processing
		onMouseUp:		function(){}
	},

	// ### Other fields
	
	// DOM element: ontains the control: see `options.element`
	element:			null,
	// DOM element: See `options.monitor`
	monitor:			null,	
	// Previous value of the monitor element 
	monitorOldValue: null,
	// setInterval timer for checking monitor.value 
	monitorTimer:	null,	
	// The Euclidean distance of dragged cursor from origin in element  
	movement:		null,	
	// Position of element at knob mouse down 
	movementAnchor:	null,	
	// Actual value of control 
	value:			null,	
	// Cache of 'value', prior to drag starts 
	initialValue:	null,	
	// When drag ends and is not canceled 
	finalValue:		null,	
	// Flag 
	dragging:		false,	
	// For rendering 
	renderRange:		null,	
	/* // Positioning info for double-click-to-value 
	 dblClickAnchor:	null,	
	*/

// ### Methods

	initialize: function( options, actx ){
		var self = this;
		this.setOptions(options);
		
		this.element = (typeof this.options.element == 'string')?
			document.id(this.options.element) 
			: this.element = this.options.element;
		
		// Required for keyboard focus
		this.element.setAttribute('tabIndex', this.element.getAttribute('tabIdex') || 0);

		// I was adding this manually a lot, and it was tedious
		// to keep looking-up UTF-8 arrow characters
		if (this.options.addpointer)
			this.element.set('text', this.options.addpointer );
		
		if (this.options.monitor){
			this.monitor = (typeof this.options.monitor == 'string')?
				document.id(this.options.monitor) 
				: this.monitor = this.options.monitor;
		}
	
		var block = this.element.getStyle('display');
		if (block=='inline' || block=='')
			this.element.setStyle('display', 'inline-block'); 
			
		self.options.range[0] = parseFloat(self.options.range[0]);
		self.options.range[1] = parseFloat(self.options.range[1]);

		if (this.monitor && this.monitor.get('value')){
			 this.value = parseFloat( this.monitor.value );
		} else if (this.options.value != null){
			this.value = parseFloat( this.options.value);
		} else if (this.element.value){
			this.value = parseFloat( this.element.value);
		}
		
		// Needed when contxt is lost in GUI
		this.element.store('self', this);

		this.renderRange = parseFloat(self.options.range[0]) * -1
			+ Math.abs( parseFloat(self.options.range[1]) );

		this.attach();
		this.render(); // display initial value1
	},

	// Initiate listeners
	attach: function(){
		this.element.addEvents({
			focus:		this.focus,
			blur:		this.blur,
		/*	dblclick:	this.dblclick,
		*/
			mousedown:	this.mousedown
		});
		if (this.monitor) this.monitor.addEvent('change', this.monitorValueChange);
		this.monitorTimer = this.monitorValueChange.periodical(
			this.options.monitorMs, this
		);
	},

	// Remove listeners
	detach: function(){
		if (__ActiveMooToolsKnobCtrl__){
			if (__ActiveMooToolsKnobCtrl__.monitorTimer)
				clearInterval( __ActiveMooToolsKnobCtrl__.monitorTimer );
			
			if (__ActiveMooToolsKnobCtrl__.monitor) 
				__ActiveMooToolsKnobCtrl__.monitor.removeEvent(
					'change', __ActiveMooToolsKnobCtrl__.monitorValueChange
				);

			
			__ActiveMooToolsKnobCtrl__.element.removeEvents({
				focus:		__ActiveMooToolsKnobCtrl__.focus,
				blur: 	 	__ActiveMooToolsKnobCtrl__.blur,
			/*	dblclick: 	__ActiveMooToolsKnobCtrl__.dblclick,
			*/
				mousedown: 	__ActiveMooToolsKnobCtrl__.mousedown
			});
			
			if (__ActiveMooToolsKnobCtrl__.dragging) 
				window.removeEvent('mouseup', __ActiveMooToolsKnobCtrl__.mouseup);
		 	
			__ActiveMooToolsKnobCtrl__.element.removeEvent('focus',__ActiveMooToolsKnobCtrl__.focus);
		 	__ActiveMooToolsKnobCtrl__.element.removeEvent('blur', __ActiveMooToolsKnobCtrl__.blur);
			
		 	window.removeEvent('mousemove', __ActiveMooToolsKnobCtrl__.mousemove);
		}
	},
	
	destroy: function(){ this.detach() },

// Double-click the control to set it's value:
// this would make my GUI a lot easier, if only 
// I could convert the angle to a value.

/*
	dblclick: function(e){
		var self = this.retrieve('self');
		if (!self.dblClickAnchor) 
			self.dblClickAnchor = self.element.getCoordinates();
		var theta = self.angleBetween2Points( 		// Find the angle between the element centre and the click:
			[e.page.x - self.dblClickAnchor.left, e.page.y - self.dblClickAnchor.top ], // Co-ords of click within element:
			[self.dblClickAnchor.width/2, self.dblClickAnchor.height/2] // Centre of element is width/2, height/2
		);
		if (theta < 0) theta += 2 * Math.PI;		// Keep radians positive
		var degrees = theta * (180 / Math.PI);	// Convert to degrees
		degrees *= -1;							// Invert to display

		console.log( degrees +' '+(degrees*-1) );		// degrees += self.options.degreesoffset;
		
		? this.value = (degrees+this.options.degreesoffset) / this.renderRange;

		self.element.setStyles({ 
			'transform': 'rotate('+degrees+'deg)',
			'-ms-transform': 'rotate('+degrees+'deg)',
			'-webkit-transform': 'rotate('+degrees+'deg)',
			'-o-transform': 'rotate('+degrees+'deg)',
			'-moz-transform': 'rotate('+degrees+'deg)',
		});
	},
*/
	
    angleBetween2Points: function ( point1, point2 ) {
        var dx = point2[0] - point1[0];
        var dy = point2[1] - point1[1];
        return Math.atan2( dx, dy );
    },
	
// Monitor changes in the .monitor field's value, and update control
	monitorValueChange: function(e){
		if ( this.monitor ){
			var v = parseFloat( this.monitor.get('value') );
			if (v != this.monitorOldValue){
				this.monitorOldValue = v;
				this.value = v;
				this.render();
			}
		}
	},

	focus: function(e){
		var self;
		if (e) e.stop();
		if (typeOf(this)=='element')
			 self = this.retrieve('self');
		else self = this;	
		__ActiveMooToolsKnobCtrl__ = self;
		window.addEvent('keydown', self.keydown);
	},

	blur: function(e){
		var self = this.retrieve('self');
		e.stop();
		window.removeEvent('keydown', self.keydown);
		__ActiveMooToolsKnobCtrl__ = null;
	},

// When the control has focus, the arrow keys change the value
// by the amount specified in the options. Use of the shift key
// can optionally change increase the change, by default by a 
// factor of ten. Use of meta/ctrl/alt maimises or minimises
// the value within the specified range.
	keydown: function(e){
		var self = __ActiveMooToolsKnobCtrl__;
		var change;
		switch(e.key){
			case 'down':
			case 'left':
				e.stop();
				change = self.options.keychangeby * -1;
				break;
			case 'up':
			case 'right':
				e.stop();
				change = self.options.keychangeby;
		}
		
		if (change){
			if (e.shift) change *= self.options.keychangebywithshift;
			if (self.options.range 
				&& (e.control || e.alt || e.meta)
			){
				self.value = self.options.range[
					(change < 0)? 0 : 1
				]
			}
			else {
				self.value += change;	
			}
			self.render();
		}
	},

	mousedown: function(e){
		e.stop();
		var self = this.retrieve('self');
		__ActiveMooToolsKnobCtrl__ = self;
		self.element.focus();
		self.focus();		
		// Get element position here, not earlier, to allow for client resizing:
		self.movementAnchor = this.getPosition();
		self.initialValue = self.value;
		window.addEvent('mousemove', self.mousemove );
		window.addEvent('mouseup', self.mouseup );
		self.dragging = true;
		self.fireEvent('mousedown');
	},

// Unsure how to bind the mouseup event to an object,
// hence the ugly global
	mouseup: function(e){
		var self = __ActiveMooToolsKnobCtrl__;
		e.stop();
		window.removeEvent('mousemove', self.mousemove);
		window.removeEvent('mouseup', self.mouseup);
		self.dragging = false;
		self.fireEvent('mouseup');
	},
	
// Sets the x, y field as the position of the mouse curosr relative to the knob,
// sets the movement field as the greater of these two, 
// and increments the value field by 'movement' multiplied by the value of
// the scale field. 
// If there is a range field, and the value falls outside of it,
// the value is constrained.
// The value field is passed to the degree field,
// and then the onTick event is fired, to allow something interesting
// to be done with these fields, prior to the CSS 'rotate' transformation,
// which uses the degree field.
	mousemove: function(e){
		var self = __ActiveMooToolsKnobCtrl__;
		if (!self.dragging) return;
		
		e.stop();
		if (window.getSelection && document.createRange) {
			var sel = window.getSelection();
			sel.removeAllRanges();
		}
    	
		self.x = e.page.x - self.movementAnchor.x;
		self.y = e.page.y - self.movementAnchor.y;
        
		/* var d = Math.sqrt(  Math.pow(self.movementAnchor.x + self.x, 2)  + Math.pow(self.movementAnchor.y + self.y, 2)  ); */
		
		self.movement = (Math.abs(self.x) > Math.abs(self.y)? self.x : self.y);
		self.value    = self.initialValue + ( self.movement * self.options.scale);
		self.render();
	},
	
// Rotates the control knob.
// Requires this.value to be set.
// Sets this.degrees, and element's aria-valuenow/-valuetext.
// If a parameter is supplied, it sets this.value
	render: function(v){
		if (typeof v != 'undefined') this.value = parseFloat( v );

		if (isNaN(this.value)) this.value = 
			this.options.range? this.options.range[0] : 0;

		if (this.options.forceint)
			this.value = parseInt( this.value );

		if (this.options.range){
			if (this.value < this.options.range[0]) this.value = this.options.range[0];
			else if (this.value > this.options.range[1]) this.value = this.options.range[1];
		}
		
		if (this.element.get('value')) this.element.set('value', this.value);
		this.element.set('title', this.value);
		
		if ( this.monitor ){
			this.monitor.set('value', this.value);
			this.monitor.set('aria-valuenow', this.value);
			this.monitor.set('aria-valuetext', this.value);
		}

		this.element.set('aria-valuenow', this.value);
		this.element.set('aria-valuetext', this.value);

		this.degrees = (this.value * (360 / this.renderRange))
			+ this.options.degreesoffset;
		
		this.fireEvent('tick');

		this.element.setStyles({ 
			'transform': 		 'rotate(' + this.degrees + 'deg)',
			'-ms-transform': 	 'rotate(' + this.degrees + 'deg)',
			'-webkit-transform':	 'rotate(' + this.degrees + 'deg)',
			'-o-transform': 		 'rotate(' + this.degrees + 'deg)',
			'-moz-transform': 	 'rotate(' + this.degrees + 'deg)'
		});
	}
});

// ## Knob.parseDOM(*selector*)
// Converts to a Knob any element matching *selector*, which
// defaults to `.mooknob`.
//	The range of a widget defaults to +/-100,
//	but can be set with the `aria-valuemin` and `aria-valuemax` attributes 
//	of the element. The initial value can be set via the `value` attribute
//	or `data-value` attribute. The chosen value of the control will be placed
//	in the `aria-valuenow` and `aria-valuetext` attributes, and in the `value`
//	attribute, if present, otherwise in the `data-value` attribute.
// *Throws* a `OperatorError` if only one of aria-valuemin and aria-valuemax are set.
Knob.parseDOM = function( selector ){
	selector = selector || '.mooknob';
	$$(selector).each( function(el){
		var opts = {
			element:	 el,
		};
		Object.keys(el.dataset).each( function(i){
			// Rough casting 
			try { 
				opts[i] = eval( el.dataset[i] )
			}
			catch(e) {
				// String literals
				if (e.toString().match(/ReferenceError/)){
					opts[i] = el.dataset[i];
				} 
				// Real issues
				else {
					console.log('Error setting '+i+' from dataset');
					console.info(e);
				}
			}
		});
		
		var min = el.get('aria-valuemin') || null;
		var max = el.get('aria-valuemax') || null;
		
		if (min || max){
			if (min && !max)
				throw new OperatorError('aria-valuemin without aria-valuemax: default range will be used');
			else if (max && !min) 
				throw new OperatorError('aria-valuemax without aria-valuemin: default range will be used');
			else 
				opts.range = [min,max];
		}
		opts.value = el.get('value') || el.dataset.value || 0;
		
		new Knob(opts);
	}); // Next element to convert
}


// ## OperatorError
// Exception object for your pleasure.
function OperatorError(message) {
   this.message = message;
   this.name = "OperatorError";
}

// ## Finally
// Que our parse of the DOM
document.addEvent('domready', function(){
	Knob.parseDOM();	
});

