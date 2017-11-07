# Kiln API

## CSS Classes

Kiln exports a number of CSS classes that may be used by plugins.

Class | Description
----- | -----------
`kiln-hide` | generic class to hide elements
`kiln-clearfix` | clearfix, so we don't keep reinventing the wheel
`kiln-normal-text` | inherit text styles from component
`kiln-display1` | large display text
`kiln-headline` | smaller display text
`kiln-title` | same size as form headers
`kiln-subheading` | same size as drawer section headers
`kiln-body` | standard kiln size
`kiln-caption` | smaller text
`kiln-button` | all caps button text
`kiln-list-header` | very small all caps text with background
`kiln-link` | link styling
`kiln-keyboard` | keyboard shortcut styling
`kiln-code` | code styling
`kiln-primary-color` | kiln primary color (blue-grey)
`kiln-accent-color` | kiln accent color (ingigo)

## JavaScript Utilities

Kiln exports a number of JavaScript utils to the browser in the `window.kiln.utils` object.

Property | Description
-------- | -----------
`componentElements` | methods for finding component elements
`caret` | methods for getting/setting caret in text fields
`create()` | function to create new component instances
`headComponents` | methods for finding head components
`interpolate()` | function to interpolate data the same way placeholders do
`label()` | function to generate labels the same way selectors and forms do
`promises` | native Promise versions of bluebird methods
`references` | constants used by kiln, as well as common methods
`urls` | methods for dealing with urls and uris
`getAvailableComponents()` | function to determine which components are allowed in a list
`local` | methods to get/set localstorage
`validationHelpers` | methods to help with pre-publish validation
`logger()` | function to create a new logger for a file (pass in the `__filename` when calling this)
`version` | current Kiln version
`components` | Vue.js components, exported by Kiln

### Vue.js Components

Component | Description
--------- | -----------
`avatar` | circular avatar image
`filterableList` | filterable list, useful for many types of UI
`person` | name, avatar, and subheader for a person, with actions
UiAutocomplete | [KeenUI autocomplete](https://josephuspaye.github.io/Keen-UI/#/ui-autocomplete)
UiButton | [KeenUI button](https://josephuspaye.github.io/Keen-UI/#/ui-button)
UiCheckbox | [single KeenUI checkbox](https://josephuspaye.github.io/Keen-UI/#/ui-checkbox)
UiCheckboxGroup | [group of KeenUI checkboxes](https://josephuspaye.github.io/Keen-UI/#/ui-checkbox-group)
UiCollapsible | [KeenUI collapsible content](https://josephuspaye.github.io/Keen-UI/#/ui-collapsible)
UiDatepicker | [KeenUI datepicker](https://josephuspaye.github.io/Keen-UI/#/ui-datepicker)
UiFileupload | [KeenUI file upload button](https://josephuspaye.github.io/Keen-UI/#/ui-fileupload)
UiIcon | [KeenUI icon](https://josephuspaye.github.io/Keen-UI/#/ui-icon) that uses [material design icons](https://material.io/icons/)
UiIconButton | [KeenUI icon button](https://josephuspaye.github.io/Keen-UI/#/ui-icon-button)
UiMenu | [KeenUI menu](https://josephuspaye.github.io/Keen-UI/#/ui-menu)
UiProgressCircular | [KeenUI circular progress indicator](https://josephuspaye.github.io/Keen-UI/#/ui-progress-circular)
UiRadioGroup | [group of KeenUI radio inputs](https://josephuspaye.github.io/Keen-UI/#/ui-radio-group)
UiRippleInk | [KeenUI ripple ink effect](https://josephuspaye.github.io/Keen-UI/#/ui-ripple-ink)
UiSelect | [KeenUI enhanced select dropdown](https://josephuspaye.github.io/Keen-UI/#/ui-select)
UiSlider | [KeenUI slider](https://josephuspaye.github.io/Keen-UI/#/ui-slider)
UiSwitch | [KeenUI switch](https://josephuspaye.github.io/Keen-UI/#/ui-switch)
UiTabs | [KeenUI tabs](https://josephuspaye.github.io/Keen-UI/#/ui-tabs)
UiTab | [individual KeenUI tab](https://josephuspaye.github.io/Keen-UI/#/ui-tabs)
UiTextbox | [KeenUI textbox](https://josephuspaye.github.io/Keen-UI/#/ui-textbox)
UiTooltip | [KeenUI tooltip](https://josephuspaye.github.io/Keen-UI/#/ui-tooltip)
