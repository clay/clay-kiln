<docs>
  # magic-button

  Append a magic button to an input.

  ## Arguments

  * **field** _(optional)_ a field to grab the value from
  * **component** _(optional)_ a name of a component to grab the component ref from
  * **transform** _(optional)_ a transform to apply to the grabbed value
  * **transformArg** _(optional)_ an argument to pass through to the transform
  * **store** _(optional)_ to grab data from the client-side store
  * **url** _(optional)_ to get data from
  * **property** _(optional)_ to get from the returned data
  * **moreMagic** _(optional)_ to run the returned value through more transforms, api calls, etc

  ☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆

  Magic buttons are extremely powerful, but can be a little confusing to configure. This is what they generally look like:

  1. specify a `field` or `component`. The button will grab the value or ref, respectively
  2. specify a `transform`. Transforms are useful when doing api calls with that data
  2. specify a `transformArg` if you need to send more information to the transform.
  3. specify a `store` path or `url` if you need to grab data from somewhere. The request will be prefixed with the `store`/`url` string you pass in.
  4. specify a `property` to grab from the result of that api call. You can use `_.get()` syntax, e.g. `foo.bar[0].baz`
  5. add `moreMagic` if you need to do anything else to the returned data

  **All of these arguments are optional!**

  ## Here are some examples:

  _Note: MediaPlay is the name of our image server._

  ### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "just grab the primary headline"

  ```yaml
  field: primaryHeadline
  ```

  ### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a caption from mediaplay"

  ```yaml
  field: url
  transform: mediaplayUrl (to change the image url into a string we can query mediaplay's api with)
  url: [mediaplay api url]
  property: metadata.caption
  ```

  ### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the url of the first mediaplay-image on this page"

  ```yaml
  component: mediaplay-image
  store: components
  property: url
  ```

  ### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab a list of items keyed by some component uri"

  ```yaml
  component: mediaplay-image
  transform: getComponentInstance (this transforms the full component uri into a ref we can pop onto the end of our site prefix)
  url: $SITE_PREFIX/lists/images (this is a ~ special token ~ that evaluates to the prefix of current site, so you can do api calls against your own clay instance)
  ```

  ### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the image url from a lede component, then ask mediaplay for the caption"

  ```yaml
  component: feature-lede
  store: components
  property: imgUrl
  moreMagic:
    -
      transform: mediaplayUrl (to change the image url into a string we can query mediaplay's api with)
      url: [mediaplay api url]
      property: metadata.caption
  ```

  ### (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧ "grab the tv show name and use it to automatically format an image url"

  ```yaml
  field: showName
  transform: formatUrl
  transformArg: [base image url]/recaps-$DATAFIELD.png ($DATAFIELD is the placeholder in our formatUrl transform)
  ```

  ☆.。.:*・°☆.。.:*・°☆.。.:*・°☆.。.:*・°☆
</docs>

<style lang="sass">
  @import '../styleguide/buttons';

  .magic-button {
    @include button-outlined($black-25, $white);

    border-bottom-right-radius: 0;
    border-right: none;
    border-top-right-radius: 0;
    clear: left;
    left: 0;
    height: 41px; // to match inputs
    margin: 5px 0 0 0;
    padding: 9px 10px 4px;
    position: relative;
    top: 0; // allow 1px for border
    width: 44px; // explicit width, see below


    svg {
      height: 22px;
      width: 24px;
    }
  }
</style>

<template>
  <button class="magic-button" @click="doMagic">
    <icon name="magic-button"></icon>
  </button>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { refAttr } from '../lib/utils/references';
  import { send } from '../lib/utils/rest';
  import { reduce as reducePromise } from '../lib/utils/promises';
  import { uriToUrl } from '../lib/utils/urls';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import transformers from './magic-button-transformers';
  import icon from '../lib/utils/icon.vue';

  /**
   * get data from a field in the current form
   * @param  {string} field
   * @return {string}
   */
  function getFieldData(field) {
    return _.get(this, `$store.state.ui.currentForm.fields.${field}`) || '';
  }

  /**
   * get the uri of the first component that matches
   * @param  {string} component name
   * @return {string}
   */
  function findComponent(component) {
    const firstComponent = find(`[${refAttr}*="/components/${component}"]`);

    if (firstComponent) {
      return firstComponent.getAttribute(refAttr);
    } else {
      return '';
    }
  }

  /**
   * get the initial data from a field or component
   * @param {string} field
   * @param {string} component
   * @returns {string}
   */
  function getData(field, component) {
    // if they specify a field to pull data from, get the data
    // otherwise, if they specify a component to pull data from, find it on the page
    // otherwise, return emptystring (it may be transformed)
    if (!_.isEmpty(field)) {
      return getFieldData.call(this, field);
    } else if (!_.isEmpty(component)) {
      return findComponent(component);
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
      } else {
        return data;
      }
    };
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

    let url = options.url, // may have $SITE_PREFIX
      transformed, promise;

    // if a transform is specified, transform the data!
    if (!_.isEmpty(transform) && _.isFunction(transformers[transform])) {
      transformed = transformers[transform](data, options.transformArg);
    } else if (_.isEmpty(transform)) {
      // if a transform isn't specified, just pass through the data
      transformed = data;
    } else {
      // they specified a transform, but it's not a function!
      throw new Error(`Transform '${transform}' is not a function!`);
    }

    // if a client-side store path is specified, grab the data from there
    // otherwise, if a url is specified, call the url and grab a property from the returned data
    if (!_.isEmpty(store)) {
      promise = Promise.resolve(_.get(this, `$store.state.${store}["${transformed}"]`)).then(getProperty(property));
    } else if (!_.isEmpty(url)) {
      // we allow a single special token in urls, `$SITE_PREFIX`, which tells us
      // to use the prefix of the current site (with proper port and protocol for api calls)
      url = url.replace('$SITE_PREFIX', uriToUrl(this.$store.state.site.prefix));
      // do an api call!
      promise = getAPI(url + transformed).then(getProperty(property));
    } else {
      // if there is no url, simply pass through the data
      promise = Promise.resolve(transformed);
    }

    return promise;
  }

  /**
   * set data into a specified field
   * @param {obejct} store
   * @param {string} name
   * @param {*} data
   */
  function setFieldData(store, name, data) {
    store.commit(UPDATE_FORMDATA, { path: name, data });
  }

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    components: {
      icon
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

        // get the initial data
        let data = getData.call(this, field, component),
          // apply an optional transform, call an optional url
          promise = doMoreMagic.call(this, data, { transform, transformArg, url, property, store: storePath });

        // if there's more magic, iterate through each item transforming the returned value
        // note: each item in moreMagic is only allowed to have transform, url, store, and property
        // (not field, component, or moreMagic)
        if (moreMagic.length) {
          return promise.then(function (res) {
            return reducePromise(moreMagic, doMoreMagic.bind(this), res);
          }).then((finalRes) => setFieldData(store, name, finalRes));
        } else {
          return promise.then((finalRes) => setFieldData(store, name, finalRes));
        }
      }
    },
    slot: 'main'
  };
</script>
