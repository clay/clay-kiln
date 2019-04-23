---
id: kilnjs
title: Kilnjs
sidebar_label: Kilnjs
---

---

Kilnjs

Kilnjs is an optional Javascript file that transforms the schema.yaml file into a dynamic Javascript Object that affects how Kiln interacts with components that use the schema.  With it, events can be attached to the inputs that are used by kiln to edit components.  These events can be used to hide or reveal different fields in the schema, update the values of those fields, make api calls, subscribe to Vuex mutations, and just about any other action allowed by JavaScript.

To take advantage of the power that Kilnjs provides you need to create a file called kiln.js within a component folder, in the same location where you place the component's schema, model, and client files. At a minimum, it should look like this.
```
'use strict';

module.exports = (schema) => {

  return schema;
};
```
A function that recieves a parameter called schema that also returns the schema.  The schema contains a JSON representation of the schema.yaml file and can be manipulated before returning.  Values can be changed, added, or deleted directly on the JSON object without any other outside code.  Anything you can do to a JSON object can be done to the schema.  However, the JSON that is returned still needs to conform to the structure needed by Kiln.  Deleting properties or adding properties that Kiln doesn't recognize can and will result in errors.

The real power of Kilnjs comes from the KilnInput object, which can be used to make the fields within a schema truly dynamic.  As an example.
```
'use strict';

const KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  // direct manipulation of schema property
  schema['_groups'].settings['_placeholder'].height = '200px';

  // wrapping schema fields in KilnInputs - pass the schema and the name of the field
  schema.enableSocialButtons = new KilnInput(schema, 'enableSocialButtons');
  schema.shareServices = new KilnInput(schema, 'shareServices');
  schema.tagline = new KilnInput(schema, 'tagline');


  /* subscribe to any Vuex action.
    examples
    OPEN_FORM (when the form gains focus, even if the form is inline)
    CLOSE_FORM (when the form loses focus, even if the form is inline)
    UPDATE_FORMDATA (when the data is changed, but not yet saved)
    UPDATE_COMPONENT (when data is actually saved) */
  schema.enableSocialButtons.subscribe('OPEN_FORM', (payload)=> {
    // .value() returns the value of the field
    //  pass a value to .value(someValue) sets the value of the field
    if (!schema.enableSocialButtons.value()) {
      // .hide and .show will display or not display the fields (if the field is a KilnInput wrapped field)
      schema.shareServices.hide();
    } else {
      schema.shareServices.show();
    }
  }, true);

  schema.enableSocialButtons.on('input', (val) => {
    if(val) {
      schema.shareServices.show();
    } else {
      schema.shareServices.hide();
    }
  });

  return schema;
};
```


---
