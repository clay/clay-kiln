<docs>
  # `magic-button`

  Append a magic button to an input.

  ### Magic Button Arguments

  * **field** - a field to grab the value from (in the current complex list, form, or component)
  * **component** - a name of a component to grab the component ref/uri from
  * **transform** - a transform to apply to the grabbed value
  * **transformArg** - an argument to pass through to the transform
  * **store** - to grab data from the client-side store
  * **url** - to get data from
  * **property** - to get from the returned data
  * **moreMagic** - to run the returned value through more transforms, api calls, etc
  * **tooltip** - text that will display in a tooltip. used to explain what each button is doing, so make it concise!

  ### Magic Button Usage

  ☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆

  Magic buttons are extremely powerful, but can be a little confusing to configure. This is what they generally look like:

  1. specify a `field` or `component`. The button will grab the value or ref, respectively. If you specify either as an array, it will look for the first field/component, then fall back to the next ones specified in the array if necessary (if the field is empty, or the component isn't on the page)
  2. specify a `transform`. Transforms are useful when doing api calls with that data. You may add custom transformers (or overwrite built-in ones) via `window.kiln.transformers`
  2. specify a `transformArg` if you need to send more information to the transform.
  3. specify a `store` path or `url` if you need to grab data from somewhere. The request will be prefixed with the `store`/`url` string you pass in.
  4. specify a `property` to grab from the result of that api call. You can use `_.get()` syntax, e.g. `foo.bar[0].baz`. If you specify as an array, it will grab the first property in the array that's not empty in the component above.
  5. add `moreMagic` if you need to do anything else to the returned data

  **All of these arguments are optional!**

  #### Here are some examples:

  _Note: MediaPlay is the name of our image server._

  ##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "just grab the primary headline"

  ```yaml
  field: primaryHeadline
  tooltip: Use Primary Headline
  ```

  ##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a caption from mediaplay"

  ```yaml
  field: url
  transform: mediaplayUrl (to change the image url into a string we can query mediaplay's api with)
  url: [mediaplay api url]
  property: metadata.caption
  tooltip: Fetch caption from Mediaplay
  ```

  ##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the url of the first mediaplay-image on this page"

  ```yaml
  component: mediaplay-image
  store: components
  property: url
  tooltip: Fetch First Image
  ```

  ##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a list of items keyed by some component uri"

  ```yaml
  component: mediaplay-image
  transform: getComponentInstance (this transforms the full component uri into a ref we can pop onto the end of our site prefix)
  url: $SITE_PREFIX/_lists/images (this is a ~ special token ~ that evaluates to the prefix of current site, so you can do api calls against your own clay instance)
  tooltip: Fetch Images
  ```

  ##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the image url from a lede component, then ask mediaplay for the caption"

  ```yaml
  component: feature-lede
  store: components
  property: imgUrl
  moreMagic:
    -
      transform: mediaplayUrl (to change the image url into a string we can query mediaplay's api with)
      url: [mediaplay api url]
      property: metadata.caption
  tooltip: Fetch Caption For Lede Image
  ```

  ##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the tv show name and use it to automatically format an image url"

  ```yaml
  field: showName
  transform: formatUrl
  transformArg: [base image url]/recaps-$DATAFIELD.png ($DATAFIELD is the placeholder in our formatUrl transform)
  tooltip: Fetch TV Show Image
  ```
  ##### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab an image url from either a mediaplay-image (url) or lede-gallery (ledeImageUrl) (whichever is higher on the page)"

  ```yaml
  component:
    - mediaplay-image
    - lede-gallery
  store: components
  property:
    - url
    - ledeImageUrl
  tooltip: Fetch First Image
  ```

  Options may also contain a `_reveal` property containing rules for when it should display.
  [The config is the same as the field-level `_reveal` property.](https://claycms.gitbooks.io/kiln/editing-components.html#reveal)

  ☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆
</docs>

<template>
  <ui-icon-button
    buttonType="button"
    color="default"
    type="secondary"
    ariaLabel="Do Magic"
    :loading="loading"
    :tooltip="args.tooltip"
    @click.stop.prevent="doMagic"
    v-if="isShown">
    <icon name="magic-button" class="magic-button-icon"></icon>
  </ui-icon-button>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { getFieldData, shouldBeRevealed } from '../lib/forms/field-helpers';
  import { refAttr, componentRoute, revealProp } from '../lib/utils/references';
  import { send } from '../lib/utils/rest';
  import { reduce as reducePromise } from '../lib/utils/promises';
  import { uriToUrl } from '../lib/utils/urls';
  import { isEmpty } from '../lib/utils/comparators';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import icon from '../lib/utils/icon.vue';
  import UiIconButton from 'keen/UiIconButton';

  /**
   * get the uri of the first component that matches
   * @param  {string} component name
   * @return {string}
   */
  function findComponent(component) {
    const firstComponent = find(`[${refAttr}*="${componentRoute}${component}"]`);

    if (firstComponent) {
      return firstComponent.getAttribute(refAttr);
    }
  }

  /**
   * get the initial data from a field or fields
   * @param  {string|array} field (or multiple fallbacks)
   * @return {string}
   */
  function getDataForFields(field) {
    if (_.isString(field) && field !== '') {
      return (
        getFieldData(
          this.$store,
          field,
          this.name,
          _.get(this.$store, 'state.ui.currentForm.uri')
        ) || ''
      );
    } else if (_.isArray(field) && field.length) {
      let found = null;

      _.each(field, (fieldName) => {
        const data = getFieldData(
          this.$store,
          fieldName,
          this.name,
          _.get(this.$store, 'state.ui.currentForm.uri')
        );

        if (data) {
          found = data;
          return false;
        }
      });

      return found || '';
    }
  }

  /**
   * get the initial data from a component or components
   * @param  {string|array} component (or multiple fallbacks)
   * @return {string}
   */
  function getDataForComponents(component) {
    if (_.isString(component) && component !== '') {
      return findComponent(component) || '';
    } else if (_.isArray(component) && component.length) {
      let found = null;

      _.each(component, (componentName) => {
        const data = findComponent(componentName);

        if (data) {
          found = data;
          return false;
        }
      });

      return found || '';
    }
  }

  /**
   * get the initial data from a field or component
   * note: if field is an array, look through each to find the first field that is NOT empty
   * note: if component is an array, find the first component ref that exists on the page
   * note: always look for fields before component refs
   * @param {string|array} field
   * @param {string|array} component
   * @returns {string}
   */
  function getData(field, component) {
    if (!_.isEmpty(field)) {
      return getDataForFields.call(this, field);
    } else if (!_.isEmpty(component)) {
      return getDataForComponents(component);
    } else {
      return '';
      // note: to keep things sane when using transforms and api calls,
      // we're treating "empty" data as emptystring (no matter what type the data might be)
    }
  }

  /**
   * get data from an api
   * @param  {string} url
   * @return {Promise}
   */
  function getAPI(url) {
    return send(url).then((res) => res.json());
  }

  /**
   * get a slice of the data returned from an api, if a property is set
   * @param  {string} property
   * @return {function}
   */
  function getProperty(property) {
    return (data) => {
      if (_.isString(property) && !_.isEmpty(property)) {
        return _.get(data, property);
      } else if (_.isArray(property) && !_.isEmpty(property)) {
        return _.get(data, _.find(property, (prop) => !_.isEmpty(data[prop])));
      } else {
        return data;
      }
    };
  }

  /**
   * apply transform, if it exists
   * note: transforms may return value or promise
   * @param  {*} data
   * @param  {string} transform
   * @param  {*} transformArg
   * @return {Promise}
   */
  function applyTransform(data, transform, transformArg) {
    const transformers = _.get(window, 'kiln.transformers', {});

    if (_.isEmpty(transform)) {
      // if a transform isn't specified, just return the data
      return Promise.resolve(data);
    } else if (!_.isFunction(transformers[transform])) {
      // they specified a transform, but it's not a function!
      return Promise.reject(new Error(`Transform '${transform}' is not a function!`));
    } else {
      // transformers may return a value or a promise
      return Promise.resolve(transformers[transform](data, transformArg));
    }
  }

  /**
   * apply transforms, call urls, and grab properties
   * @param {string} data
   * @param {object} options
   * @returns {Promise}
   */
  function doMoreMagic(data, options) {
    const transform = options.transform,
      property = options.property,
      store = options.store;

    let url = options.url; // may have $SITE_PREFIX

    return applyTransform(data, transform, options.transformArg).then((transformed) => {
      if (!_.isEmpty(store)) {
        // if a client-side store path is specified, grab the data from there
        // otherwise, if a url is specified, call the url and grab a property from the returned data
        return getProperty(property)(_.get(this, `$store.state.${store}["${transformed}"]`));
      } else if (!_.isEmpty(url)) {
        // we allow a single special token in urls, `$SITE_PREFIX`, which tells us
        // to use the prefix of the current site (with proper port and protocol for api calls)
        url = url.replace('$SITE_PREFIX', uriToUrl(this.$store.state.site.prefix));
        // do an api call!
        return getAPI(url + transformed).then(getProperty(property));
      } else {
        // if there is no url, simply pass through the data
        return transformed;
      }
    });
  }

  /**
   * set data into a specified field
   * @param {obejct} store
   * @param {string} name
   * @param {*} data
   */
  function setFieldData(store, name, data) {
    if (isEmpty(data)) {
      store.commit(UPDATE_FORMDATA, { path: name, data: '' }); // set emptystring in field if there's no data
    } else {
      store.commit(UPDATE_FORMDATA, { path: name, data });
    }
  }

  export default {
    props: ['name', 'data', 'schema', 'args', revealProp],
    data() {
      return {
        loading: false,
        isShown: shouldBeRevealed(this.$store, this.args[revealProp], this.name)
      };
    },
    methods: {
      doMagic() {
        const field = this.args.field,
          component = this.args.component,
          transform = this.args.transform,
          transformArg = this.args.transformArg,
          url = this.args.url,
          property = this.args.property,
          moreMagic = this.args.moreMagic || [],
          storePath = this.args.store,
          store = this.$store,
          name = this.name;

        // unset isInvalidDrag after clicking somewhere in the form
        // (since the button is stopping propagation)
        window.kiln.isInvalidDrag = false;
        // start the loading spinner
        this.loading = true;

        // get the initial data
        let data = getData.call(this, field, component),
          // apply an optional transform, call an optional url
          promise = doMoreMagic.call(this, data, {
            transform,
            transformArg,
            url,
            property,
            store: storePath
          });

        // if there's more magic, iterate through each item transforming the returned value
        // note: each item in moreMagic is only allowed to have transform, url, store, and property
        // (not field, component, or moreMagic)
        if (moreMagic.length) {
          return promise
            .then(function (res) {
              return reducePromise(moreMagic, doMoreMagic.bind(this), res);
            })
            .then((finalRes) => {
              setFieldData(store, name, finalRes);
              this.loading = false;
            });
        } else {
          return promise.then((finalRes) => {
            setFieldData(store, name, finalRes);
            this.loading = false;
          });
        }
      }
    },
    components: {
      icon,
      UiIconButton
    }
  };
</script>

<style lang="sass">
  @import '../styleguide/colors';

  .magic-button-icon svg {
    fill: $text-color;
    height: 18px;
    // offset this for visual balance
    margin-left: 3px;
    margin-top: 3px;
    transition: 100ms fill ease;
    width: 20px;
  }

  .is-active .magic-button-icon svg {
    fill: $brand-primary-color;
  }

  .is-disabled .magic-button-icon {
    pointer-events: none;

    svg {
      fill: $text-disabled-color;
    }
  }

  .is-invalid .magic-button-icon svg {
    fill: $md-red;
  }
</style>
