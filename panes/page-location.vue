<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/inputs';
  @import '../styleguide/buttons';
  @import '../styleguide/typography';

  .custom-url-form {
    padding: 17px;

    .custom-url-message {
      @include primary-text();
    }

    .custom-url-input {
      @include input();

      margin: 10px 0;
    }

    .custom-url-submit {
      @include button-outlined($text, $input-background);

      height: auto;
      font-size: 16px;
      margin: 0;
      padding: 15px 0;
      width: 100%;
    }
  }
</style>

<template>
  <form class="custom-url-form" @submit.prevent="saveLocation">
    <label for="custom-url" class="custom-url-message">Designate a custom URL for this page. This should only be used for special cases.</label>
    <input id="custom-url" class="custom-url-input" type="text" v-model="location" placeholder="/special-page.html" @input="onInput" />
    <button type="submit" class="custom-url-submit">Save Location</button>
  </form>
</template>

<script>
  import _ from 'lodash';
  import Routable from 'routable';
  import { uriToUrl } from '../lib/utils/urls';

  function isValidUrl(val, routes) {
    return !!_.find(routes, function (route) {
      const r = new Routable(route);

      return r.test(val) || r.test('/' + val); // test with and without the beginning slash
    });
  }

  export default {
    data() {
      return {
        location: ''
      };
    },
    methods: {
      saveLocation() {
        const prefix = _.get(this.$store, 'state.site.prefix'),
          val = this.location,
          store = this.$store;

        let url;

        // make sure we're not adding the site prefix twice!
        // handle both /paths and http://full-urls
        if (val.match(/^http/i)) {
          // full url
          url = val;
        } else if (val.match(/^\/\S/i)) {
          // already starts with a slash
          url = uriToUrl(prefix + val);
        } else if (val.match(/^\S/i)) {
          // add the slash ourselves
          url = uriToUrl(prefix + '/' + val);
        } else if (val === '') {
          // unset custom url
          url === '';
        }

        store.dispatch('savePage', { customUrl: url }).then(() => {
          if (url) {
            store.dispatch('showStatus', { type: 'save', message: 'Saved custom page url' });
          } else {
            store.dispatch('showStatus', { type: 'save', message: 'Removed custom page url' });
          }
        });
      },
      onInput(e) {
        // validate that what the user typed in is routable
        // note: if it's empty string, catch it early (removing custom urls is totally valid)
        // note: if it's a full url, assume the user knows what they're doing and say it's valid
        const val = this.location,
          input = e.currentTarget,
          routes = _.get(this.$store, 'state.locals.routes');

        if (val === '' || val.match(/^http/i) || isValidUrl(val, routes)) {
          input.setCustomValidity('');
        } else {
          input.setCustomValidity('Custom URL must match an available route!');
        }
      }
    },
    mounted() {
      const prefix = _.get(this.$store, 'state.site.prefix'),
        customUrl = _.get(this.$store, 'state.page.data.customUrl') || '';

      // get location when form opens
      // remove prefix when displaying the url in the form. it'll be added when saving
      this.location = customUrl.replace(uriToUrl(prefix), '');
    }
  };
</script>
