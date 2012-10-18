/*
---
description: A rotary knob input control

license: MIT-style

authors:
- Lee Goddard

requires:
- Core

provides: [Knob]

...
*/

/*
	Version 0.2 - WIA-ARIA and keyboard control Support

	This code is copyright (C) 2012 Lee Goddard, Server-side Systems Ltd.
	All Rights Reserved.
	
	Available under the same terms as Perl5.

	Provides events:
	
		onMousedown - when the knob is clicked
		onTick - every time the knob turns
		onMouseup - when the knob is released
*/

var __ActiveMooToolsKnobCtrl__ = null;

var Knob = new Class({
	Implements: [Options, Events],
	
	options: {					// Keep options lower-case for dataset compatability
		element: 		null,	/* DOM element to replace with this control */
		value:			0,		/* Initial value of control: if not supplied, taken from attributes 'value' or 'data-value' */
		addpointer:		'↑',		/* Default is an up-arrow (↑). If you set this to null, the up-arrow is not added to the knob element */
		range:			[-100, 100], 	/* Minimum and maximum values */
		scale:			1,		/* Multiplier applied to number of px moved, to acheive change in .value */
		keychangeby:				1, 	/* When arrow keys control knob, incrase knob value by this */
		keychangebywithshift: 10, /* As keyUnit but for when shift key is also pressed */
		
		monitor:		null, /* May be a string or DOM element to monitor: changes in this elements *value* attribute will change the control's *value* attribute, and cause the control to be re-rendered. */
		monitorMs:	1000/4, /* Frequency of checking for monitor.value changes */
		
		onTick:			function(){},
		onMousedown: 	function(){},
		onMouseUp:		function(){}
	},

	element:			null,
	monitor:			null,	/* See options.monitor */
	monitorOldValue: null,
	monitorTimer:	null,	/* setInterval timer for checking monitor.value */
	movement:		null,	/* The Euclidean distance of dragged cursor from origin in element  */
	anchor:			null,	/* Position of element at knob mouse down */
	value:			null,	/* Actual value of control */
	initialValue:	null,	/* Cache of 'value', prior to drag starts */
	finalValue:		null,	/* When drag ends and is not canceled */
	dragging:		false,	/* Flag */
	renderRange:		null,	/* For rendering */
	
	initialize: function( options, actx ){
		var self = this;
		this.setOptions(options);
		
		this.element = (typeof this.options.element == 'string')?
			document.id(this.options.element) 
			: this.element = this.options.element;
		
		// console.debug('Initialising knob '+this.element.id);
			
		this.element.setAttribute('tabIndex', this.element.getAttribute('tabIdex') || 0);

		if (this.options.addpointer){
			this.element.set('text', this.options.addpointer );
		}
		
		if (this.options.monitor){
			this.monitor = (typeof this.options.monitor == 'string')?
				document.id(this.options.monitor) 
				: this.monitor = this.options.monitor;
		}
	
		this.element.addEvents({
			focus: this.focus,
			blur: this.blur
		});

		var block = this.element.getStyle('display');
		if (block=='inline' || block=='')
			this.element.setStyle('display', 'inline-block'); 
			
		if (this.monitor && this.monitor.get('value')){
			 this.value = parseFloat( this.monitor.value );
		} else if (this.options.value != null){
			this.value = parseFloat( this.options.value);
		} else if (this.element.value){
			this.value = parseFloat( this.element.value);
		}
		
		this.element.store('self', this);

		self.options.range[0] = parseFloat(self.options.range[0]);
		self.options.range[1] = parseFloat(self.options.range[1]);
			
		this.renderRange = parseFloat(self.options.range[0]) * -1
			+ Math.abs( parseFloat(self.options.range[1]) );

		this.attach();
		this.render(); // dispay initial value1
	},

	attach: function(){
		this.element.addEvent('mousedown', this.mousedown);
		if (this.monitor) this.monitor.addEvent('change', this.monitorValueChange);
		this.monitorTimer = this.monitorValueChange.periodical(
			this.options.monitorMs, this
		);
	},
	
	/* Monitor changes in the .monitor field's value, and update control */
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

	destroy: function(){ this.detach() },
	
	detach: function(){
		if (this.monitorTimer) clearInterval( this.monitorTimer );
		this.element.removeEvent('mousedown', this.mousedown);
		if (this.dragging) 
			window.removeEvent('mouseup', __ActiveMooToolsKnobCtrl__.mouseup);
		if (__ActiveMooToolsKnobCtrl__){
		 	__ActiveMooToolsKnobCtrl__.element.removeEvent('focus',__ActiveMooToolsKnobCtrl__.focus);
		 	__ActiveMooToolsKnobCtrl__.element.removeEvent('blur', __ActiveMooToolsKnobCtrl__.blur);
			window.removeEvent('mousemove', __ActiveMooToolsKnobCtrl__.mousemove);
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
		// console.debug('Focused '+self.element.id);
	},

	blur: function(e){
		var self = this.retrieve('self');
		e.stop();
		window.removeEvent('keydown', self.keydown);
		__ActiveMooToolsKnobCtrl__ = null;
	},

	/* When the control has focus, the arrow keys change the value
		by the amount specified in the options. Use of the shift key
		can optionally change increase the change, by default by a 
		factor of ten. Use of meta/ctrl/alt maimises or minimises
		the value within the specified range. */
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
		// Get element position here, not earlier, to allow for resizing:
		e.stop();
		var self = this.retrieve('self');
		__ActiveMooToolsKnobCtrl__ = self;
		self.element.focus();
		self.focus();		
		self.anchor = this.getPosition();
		self.initialValue = self.value;
		window.addEvent('mousemove', self.mousemove );
		// How to maintain lexical context?
		window.addEvent('mouseup', self.mouseup );
		self.dragging = true;
		self.fireEvent('mousedown');
	},
	
	mouseup: function(e){
		var self = __ActiveMooToolsKnobCtrl__;
		e.stop();
		window.removeEvent('mousemove', self.mousemove);
		window.removeEvent('mouseup', self.mouseup);
		self.dragging = false;
		self.fireEvent('mouseup');
	},
	
	/* Sets the x, y field as the position of the mouse curosr relative to the knob,
	   sets the movement field as the greater of these two, 
	   and increments the value field by 'movement' multiplied by the value of
	   the scale field. 
	   If there is a range field, and the value falls outside of it,
	   the value is constrained.
	   The value field is passed to the degree field,
	   and then the onTick event is fired, to allow something interesting
	   to be done with these fields, prior to the CSS 'rotate' transformation,
	   which uses the degree field.
	*/
	mousemove: function(e){
		var self = __ActiveMooToolsKnobCtrl__;
		if (!self.dragging) return;
		
		e.stop();
		if (window.getSelection && document.createRange) {
			var sel = window.getSelection();
			sel.removeAllRanges();
		}
    	
		self.x = e.page.x - self.anchor.x;
		self.y = e.page.y - self.anchor.y;
        
		// var d = Math.sqrt(  Math.pow(self.anchor.x + self.x, 2)  + Math.pow(self.anchor.y + self.y, 2)  );
		
		self.movement = (Math.abs(self.x) > Math.abs(self.y)? self.x : self.y);
		self.value    = self.initialValue + ( self.movement * self.options.scale);

		self.render();
	},
	
	/* Rotates the control knob.
		Requires this.value to be set.
		Sets this.degrees, and element's aria-valuenow/-valuetext.
		If a parameter is supplied, it sets this.value
	*/
	render: function(v){
		if (typeof v != 'undefined') this.value = parseFloat( v );

		if (this.options.range){
			if (this.value < this.options.range[0]) this.value = this.options.range[0];
			else if (this.value > this.options.range[1]) this.value = this.options.range[1];
		}
		
		if (this.element.get('value')) this.element.set('value', this.value);
		if ( this.monitor ){
			this.monitor.set('value', this.value);
			this.monitor.set('aria-valuenow', this.value);
			this.monitor.set('aria-valuetext', this.value);
		}

		this.degrees = this.value * (360 / this.range);
		this.element.set('aria-valuenow', this.value);
		this.element.set('aria-valuetext', this.value);
		this.fireEvent('tick');
		this.element.setStyles({ 
			'transform': 'rotate('+this.degrees+'deg)',
			'-ms-transform': 'rotate('+this.degrees+'deg)',
			'-webkit-transform': 'rotate('+this.degrees+'deg)',
			'-o-transform': 'rotate('+this.degrees+'deg)',
			'-moz-transform': 'rotate('+this.degrees+'deg)',
		});
	}
});

/*
	The range of a widget defaults to +/-100,
	but can be set with the aria-valuemin and aria-valuemax attributes 
	of the element. The initial value can be set via the value attribute
	or data-value attribute. The chosen value of the control will be placed
	in the aria-valuenow and aria-valuetext attributes, and in the value
	attribute, if present, otherwise in the data-value attribute.
*/
Knob.parseDOM = function( selector ){
	selector = selector || '.mooknob';
	$$(selector).each( function(el){
		var opts = {
			element:	 el,
		};
		Object.keys(el.dataset).each( function(i){
			try { // rough casting
				opts[i] = eval( el.dataset[i] )
			}
			catch(e) {
				// String literals
				if (e.toString().match(/ReferenceError/)){
					opts[i] = el.dataset[i];
				} 
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
				throw('aria-valuemin without aria-valuemax: default range will be used');
			else if (max && !min) 
				throw('aria-valuemax without aria-valuemin: default range will be used');
			else 
				opts.range = [min,max];
		}
		opts.value = el.get('value') || el.dataset.value || 0;
		
		// console.debug('Create knob '+el.id);
		new Knob(opts);
	});
}	

document.addEvent('domready', function(){
	Knob.parseDOM();	
});

