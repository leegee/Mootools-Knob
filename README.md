Mootools-Knob
=============

Provides a rotary knob control for Mootools

![Screenshot](https://raw.github.com/leegee/Mootools-Knob/master/Docs/screenshot.png)

How to use
----------

This widget aims to provide a rotary knob control for MooTools.

A *Knob* object can be instantiated with a variety of options,
and the library also parses the DOM for elements with class *.mooknob*,
replacing each with an instance of the Knob control.

All knobs require user-supplied styling.

Knobs can be controlled with keyboard and/or mouse, and provide
WIA-ARIA attributes.

Knobs can monitor and reflect a field with a *value* attribute.

Controlling the Control
-----------------------
By default, the control increments and decrements by 1. If the
control receives keyboard focus, the cursor keys may be used to
increment and decrement the value - by 10 if if the shift key is
depressed; if the alt, or meta keys are depressed, the value
is set to its maximum or minimum.

Monitoring
----------

A control can monitor and reflect values of another element's *value* fileld: such element should be supplied via the *monotpr* field, as described in 'Options', below.

Initial Control Value
---------------------

The initial value of the control comes from either the *monitor* elements' value, or the *options.value*/the *data-value* attribute of the *element*, or from the element's *value* field, in that order.

CSS
---

As seems to be usual for MooTools, no CSS is supplied. However,
the Docs/index.html page contains some examples. A basic gray
and round knob can be achieved without graphics if you client
supports the *border-radius* property of CSS3:

	<style>
	.rotary {
		border: 1px solid black;
		background: silver;
		text-align: center;
		border-radius: 50%;
		font-weight: bold;
		font-size:28pt;
		width: 32pt;
		height: 32pt;
	}
	</style>	

If you place in your knob-to-be element a UTF-8 up-arrow of some kind, 
it looks passable.

Use in HTML, without Javascript
-------------------------------

The widget can be configued using the attribute of any element 
which it consumes.

The range of values the widget will supports defaults to +/-100,
but can be set with the aria-valuemin and aria-valuemax attributes 
of the element. 

The initial value can be set via the value attribute
or data-value attribute. 

The chosen value of the control will be placed
in the aria-valuenow and aria-valuetext attributes, and in the value
attribute, if present, otherwise in the data-value attribute.

For example, the following element will produce a rotary knob with
an up-arrow (↑), an initial value of 10, and range between -20 and 20:

	<span id='knob1' 
		data-value='10' 
		aria-valuemin='-20'
		aria-valuemax='20'
	>↑</span>

JavaScript API
--------------

The equivalent to the above HTML would be:

	new Knob({
		element: 'knob1',
		range: [-20, 20],
		value: 10
	});
	
Options
-------

The following options are available. Some may be supplied as 
*dataset-* attributes when their values are literal.

* **element**: the DOM element to replace with this control
* **value**: (*0*) The iInitial value of the control. If not supplied, taken from attributes *value* or *data-value*
* **range**: (*[-100, 100]*) The minimum and maximum values. May be supplied in HTML as *aria-valuemin* and *aria-valuemax*.
* **scale**: (*1*) Multiplier applied to the number of pixels the mosue may be moved, to acheive change in the **value** field (see Events, below)
* **keychangeby**: (*1*) When arrow keys control the knob, the **value** field is increased by this factor
* **keychangebywithshift**: (*10*) As **keychangeby**, above, but for when shift is held.
* **monitor**: A name for, or instance of, a DOM element that has a **value** field that shoudl be monitored for changes, to be reflected by this control. Intended for text input elements.
* **monitorMs**: (*250*) The interval, in milliseconds, at which to check the **monitor** element, if supplied. The monitor element's *value* (an aria-related) attribute will also be updated with changes to the control.
* **addpointer**: (*↑*) By default the module (since 0.3) replaces **element**'s content with  an up-arrow to the element. Disable this by setting this option to null or false.

Evebts
------

In addition to the above options, the following events are supplied:

* **onMousedown**: fired when the knob is clicked
* **onMouseup**: fired when the knob is released but before it is rendered
* **onTick**: fired as the knob is turned

The **onTick** event is intended to allow the user to adjust the behaviour 
of the widget, using the following object fields:

* **x** and **y** represent the position of the mouse curosr relative to the knob
* **movement**  contains the greater of these two, 
* **value** contains the previous value incremented by **movement** multiplied by the value of the **scale** option (*this.options.scale*).
* **degrees** contains the amount by which the knob will be rotated, and can be set in accordance with the values accepted by the CSS3 Transform/rotate property (0-360, afik)
	
The **onTick** event could just be used to update a text display field.

Public Methods
--------------

* **render**: Update the control to reflect the current state of the **value** field, which may be set by supply a single, numeric argument
* **attach**: Called at instantiation to attach eveents to allow the control to operate
* **detach**: Removes events

