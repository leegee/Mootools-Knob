Mootools-Knob
=============

Provides a rotary knob control for Mootools

![Screenshot](https://raw.github.com/leegee/Mootools-Knob/master/Demo/screenshot.png)

How to use
----------

This widget aims to provide a rotary knob control for MooTools.

A *Knob* object can be instantiated with a variety of options,
and the library also parses the DOM for elements with class *.mooknob*,
replacing each with an instance of the Knob control.

All knobs require user-supplied styling: details below.

Knobs can be controlled with cursor keys, mouse drags, and double clicks,
and provide WIA-ARIA attributes populated from both the initial data,
and computed data in real time.

Knobs can monitor and reflect a field with a *value* attribute.

Controlling the Control
-----------------------
By default, the control increments and decrements by 1. If the
control receives keyboard focus, the cursor keys may be used to
increment and decrement the value - by 10 if if the shift key is
depressed. If the alt/meta key is depressed whilst a cursor key is 
pressed, the value of the control is set to its maximum or minimum,
dependent on the cursor key.

The effect of mouse dragging the control is scaled using the
option `scale`: that is, the number of pixels moved will be multiplied
by the value of the `scale` option (or `data-scale` attribute) and added
to the current value of the knob: the great the range of the knob, the smaller
the value of `scale`. If you do not like the speed of the knob movement
in relation to mouse dragging, change `scale`.

Monitoring
----------

A control can monitor and reflect values of another element's `value` fileld: such element should be supplied via the *monotpr* field, as described in 'Options', below.

Initial Control Value
---------------------

The initial value of the control comes from either the `monitor` elements' `value` attribute, or the `options.value` (which may come from the `data-value` attribute of the `element`), or from the element's `value` attribute, in that order.

Styling
-------

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

If select the *addpointer* option (below), the widget will contain a UTF-8 up-arrow.

WIA-ARIA And Use in HTML, without Javascript
--------------------------------------------

The widget can be configued using the attribute of any element 
which it consumes. Any option listed under the JavaScript API
can be passed as an HTML attribute, prefixed with `data-`.

The range of values the widget will supports (default ±100)
can be set with the `aria-valuemin` and `aria-valuemax` attributes 
of the element, which equate to the object's `range` option array.

The initial (described above) will be placed
in the `aria-valuenow` and `aria-valuetext` attributes, as well as
in the `value` attribute, if present, otherwise in the `data-value` attribute.

For example, the following element will produce a rotary knob with
an up-arrow (`↑`), an initial value of 5, and range between 0 and 10:

	<span id='knob1' 
		data-value='5' 
		aria-valuemin='0'
		aria-valuemax='10'
	>↑</span>

JavaScript API
--------------

The equivalent to the above HTML would be:

	new Knob({
		element: 'knob1',
		value: 5,
		range: [0, 10]
	});
	
Options
-------

The following options are available. Some may be supplied as 
*dataset-* attributes when their values are literal.

* `element`: the DOM element to replace with this control
* `value`: (*0*) The iInitial value of the control. If not supplied, taken from attributes *value* or *data-value*
* `range`: (*[-100, 100]*) The minimum and maximum values. May be supplied in HTML as *aria-valuemin* and *aria-valuemax*.
* `scale`: (*null*) Multiplier applied to the number of pixels the mosue may be moved, to acheive change in the `value` field (see Events, below). This is set automatically upon initialisation, unless the user specifies a value.
* `keychangeby`: (*1*) When arrow keys control the knob, the `value` field is increased by this factor
* `keychangebywithshift`: (*10*) As `keychangeby`, above, but for when shift is held.
* `monitor`: A name for, or instance of, a DOM element that has a `value` field that shoudl be monitored for changes, to be reflected by this control. Intended for text input elements.
* `monitorMs`: (*250*) The interval, in milliseconds, at which to check the `monitor` element, if supplied. The monitor element's *value* (an aria-related) attribute will also be updated with changes to the control.
* `addpointer`: (*↑*) By default the module (since 0.3) replaces `element`'s content with  an up-arrow to the element. Disable this by setting this option to null or false.
* `forceint`:	(*false*) Force all values to be integers
* `degreesoffset`: (*0*) Offset, in degrees, to apply to the rotation of the knob. This does not effect the value of the control, only its appearance, and can change the style of the control form a pan control to a volume control, for example. The default is *0* but this may change.
`completedelay`: (*500*) Number of milliseconds to wait for inactivity before firing the `onComplete` event.

Events
------

In addition to the above options, the following events are supported: 

* `onMousedown`: fired when the knob is clicked
* `onMouseup`: fired when the knob is released but before it is rendered
* `onComplete`: fired when no changes have taken place for the number milliseconds defined in the `completedelay` option.
* `onTick`: fired as the knob is turned

The options may be passed as HTML dataset attributes by prepending `data-`,
though you will need to consider that supplied code will be evaluated when
parsed from the DOM, so will need something like this:

    (function(){
        alert("My value is "+this.value)
    })

The `onTick` event is intended to allow the user to adjust the behaviour 
of the widget, and to allow this widget to affect other objects,
using the following object fields:

* `x` and `y` represent the position of the mouse curosr relative to the knob
* `movement`  contains the greater of these two
* `value` contains the calculated value of the knob
* `degrees` contains the amount by which the knob will be rotated, after `onTick` has returned, and can be set in accordance with the value in degrees, as accepted by the CSS3 Transform/rotate property.
	
Public Methods
--------------

* `render`: Update the control to reflect the current state of the `value` field, which may be set by supply a single, numeric argument
* `attach`: Called at instantiation to attach eveents to allow the control to operate
* `detach`: Removes events

TO DO
-----

* Double click support seems to miss the very minimum value of the range.

* Considering if the knob should support more intuative dragging, dependant upon the knob's current value.

FAQ
---

`When using HTML mark-up to create a knob, why do *valuemin* and *valuemax* not work?`

The acceptable range of inputs should be specified through `aria-valuemin` and `aria-valuemax*, not `data-valuemin` and `data-valuemax`.

`Why are arguments all lower case, rather than camel case?`

To make parsing of `dataset` attributes easier: these are all forced to lower case by the browser.

