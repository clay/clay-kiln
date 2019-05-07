---
id: kilnjs
title: Kilnjs
sidebar_label: Kilnjs
---

---

Kilnjs is an optional Javascript file that transforms the schema.yaml file into a dynamic Javascript Object that affects how Kiln interacts with components that use the schema.  With it, events can be attached to the inputs that are used by kiln to edit components.  These events can be used to hide or reveal different fields in the schema, update the values of those fields, make api calls, subscribe to Vuex mutations, and just about any other action allowed by JavaScript.

Using Kilnjs, you can remove the logic from the schema.yaml file and move it into JavaScript, keeping the schema file for presentational information.

To take advantage of the power that Kilnjs provides you need to create a file called kiln.js within a component folder, in the same location where you place the component's schema, model, and client files. At a minimum, it should look like this.
```
'use strict';

module.exports = (schema) => {

  return schema;
};
```
A function that recieves a parameter called schema that also returns the schema.  The schema contains a JSON representation of the schema.yaml file and can be manipulated before returning.  Values can be changed, added, or deleted directly on the JSON object without any other outside code.  Anything you can do to a JSON object can be done to the schema.  However, the JSON that is returned still needs to conform to the structure needed by Kiln.  Deleting properties or adding properties that Kiln doesn't recognize can and will result in errors.

The real power of Kilnjs comes from the KilnInput object, which can be used to make the fields within a schema truly dynamic.  Using KilnInput you can add events to the different form inputs as detailed on the [Form Inputs page](input).  You can also subscribe to Vuex actions as described below.

To make a schema field a KilnInput, you set it to a new instance of KilnInput, passing it to the schema and the name of the field.

```
const KilnInput = window.kiln.kilnInput;

module.exports = (schema) => {
  schema.title = new KilnInput(schema, 'title');

  return schema;
};
```

---

## Events

You can attach events to the schema inputs.  The events you can attach vary depending upon the type input. The different events are detailed on the [Form Inputs page](input).

* ***on(event, callbackFunction)*** - pass it the event as a string, along with a callback function that is run after the event happens

```
  schema.enableSocialButtons.on('input', (val) => {
    if(val) {
      schema.shareServices.show();
    } else {
      schema.shareServices.hide();
    }
  });
```

### Validation

By attaching events, one of the things you can use kilnjs for is to do field validation.

```
module.exports = (schema) => {
  schema.title = new KilnInput(schema, 'title');

  schema.title.on('keydown', (e) => {
    // prevent numbers from being entered in the title field
    if (!isNaN(e.key)) {
      e.preventDefault();
    }
  });

  return schema;
};
```

---

## Vuex Actions to Subscribe To

The following are some of the Vuex actions that you can subscribe to using Kiln.js. The actions can be scoped so that they only trigger the subscription function when the action is triggered by a component of the same type as the subscribing component. In other words, if scope is set to true on a paragraph element, then the subscription function would only be called when a paragraph element triggers the Vuex action, but not when any other type of component triggers the Vuex action.  When the scope is set to false, the subscription function is called whenever _any_ component triggers the Vuex action.

* ***OPEN_FORM*** - Triggered when a Kiln form is opened. Note that this can triggered by both a modal form _and_ an inline form, so just clicking into a paragraph or other inline field will trigger this action. The payload returned from this action contains a JSON representation of the Schema along with the component uri that was opened in the form.

* ***CLOSE_FORM*** - Triggered when a Kiln form is closed. For inline fields this occurs when the field loses focus.  When the user clicks out of the field.  The payload returned from this action is undefined.

* ***UPDATE_FORMDATA*** - Triggered when a user changes the data in a form field.  This happens "on change", _not_ "on save". The payload returns and object containing the path (field being changed) and data (the new value).

* ***UPDATE_COMPONENT*** - Triggered when a component is saved.  The payload returns a json object containing all the fields in the component's schema, with the values for each of them.

* ***UPDATE_PAGE_STATE*** - Triggered when the page state changes.  When it is published, unpublished, etc. The payload returned contains the page meta information, including published date/time, update date/time, history, users, etc.

Often you might not wish to associate a subscription with a specific field, but rather to something more general.  You can instantiate a KilnInput without referencing a specific field. Of course, if it makes sense to create a connection between a field and the action involved with a subscription, you can use the subscribe function on a field.  It can be done either way.  It's just a matter of what makes the intent clearer.

```
module.exports = (schema) => {
  const subscriptions = new KilnInput(schema);

  schema.myDate = new KilnInput(schema, 'myDate');

  subscriptions.subscribe('UPDATE_COMPONENT', (payload)=> {
    // do something when a component has been updated
    // you can also test the type of component updated
    // by checking the value of payload.data.componentVariation
    // and only reacting when it's a certain type of component
    // or if the component's new value is equal or not to some value
  }, false);

  schema.myDate.subscribe('UPDATE_COMPONENT', (payload)=> {
    // same as above, just attached to the myDate field, which implies
    // you want to do something to the myDate field with the payload
  });

  return schema;
};

```

---

## Kilnjs custom methods

KilnInput also provides its own set of custom methods.

### getComponentInstances

* ***getComponentInstances(componentName)*** - returns an array containing the uris of all components of type componentName that are on the current page.

```
kilnInput.getComponentInstances('paragraph');
```

### reRenderInstance

* ***reRenderInstance(uri)*** - Fetchs the component's data and passes it through the components model.render function, thus refreshing it on the page. For instance, if some outside source has updated component data and does not trigger a page refresh, you could force a component rerender that would include the updated data.

```
// if a paragraph component is updated, then rerender the instances of the snash component
eventBus.subscribe('UPDATE_COMPONENT', (payload)=> {
    if (payload.data.componentVariation === 'paragraph') {
      let snashInstances = eventBus.getComponentInstances('snash');
      snashInstances.forEach((instance) => {
        eventBus.reRenderInstance(instance);
      });
    }
  }, false);
```




### setProp

* ***setProp(prop, value)*** - change value of a property on the input

```
kilninput.setProp('_has', { ...kilninput['_has'], input: 'select' });
```

### show/hide

* ***show()*** - used to make an input visible.

* ***hide()*** - used to make an input invisible

```
  schema.enableSocialButtons.on('input', (val) => {
    if(val) {
      schema.shareServices.show();
    } else {
      schema.shareServices.hide();
    }
  });
```

### url

* ***url()*** - returns the url object from Vuex state of the component that is currently being edited. Object contains the component name, the instance, and the path

```
  kilnInput.url()

  /// returns an object structured like this

  {
    component: "meta-title"
    instance: "cjtfuc3rw00019fz9egagqev0"
    path: "settings"
  }
```

### value

* ***value(val)*** - used to set and retrieve value on an input. If a value is passed, it sets the value, otherwise it retrieves it.

```
schema.title.value(); // gets the value of title
schema.title.value('Some New Value'); // sets the value of title
```

---

### Example kiln.js file

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


  /* subscribe to a Vuex action. */
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
