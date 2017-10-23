<style lang="sass">
  @import '../../styleguide/typography';

  .add-user-modal {
    display: flex;
    flex-direction: column;

    .add-user-provider,
    .add-user-admin {
      margin: 16px 0 0;
      z-index: 0;
    }

    .add-user-info {
      @include type-body();

      margin-top: 16px;
    }

    .add-user-button {
      margin-top: 16px;
    }
  }
</style>

<template>
  <form class="add-user-modal" @submit.prevent="createUser">
    <ui-textbox class="add-user-username" v-model="username" :required="true" :autofocus="true" :floatingLabel="true" label="Username"></ui-textbox>
    <ui-select class="add-user-provider" :disabled="providers.length < 2" v-model="provider" :options="providers" label="Provider" :floatingLabel="true"></ui-select>
    <ui-switch class="add-user-admin" v-model="isAdmin" label="Admin"></ui-switch>
    <span class="add-user-info">While <em>all</em> accounts can edit, only admins can manage users, create and edit page templates, and change permissions.</span>
    <ui-button class="add-user-button" color="primary" :disabled="username === ''">Invite to Clay</ui-button>
  </form>
</template>

<script>
  import _ from 'lodash';
  import { postJSON } from '../core-data/api';
  import logger from '../utils/log';
  import UiTextbox from 'keen/UiTextbox';
  import UiSelect from 'keen/UiSelect';
  import UiSwitch from 'keen/UiSwitch';
  import UiButton from 'keen/UiButton';

  const log = logger(__filename);

  export default {
    data() {
      return {
        username: '',
        provider: {},
        isAdmin: false
      };
    },
    computed: {
      providers() {
        return _.reduce(_.get(this.$store, 'state.site.providers'), (results, provider) => {
          if (provider !== 'apikey') {
            results.push({
              value: provider,
              label: _.startCase(provider)
            });
          }
          return results;
        }, []);
      }
    },
    methods: {
      createUser() {
        const store = this.$store,
          prefix = _.get(store, 'state.site.prefix'),
          username = this.username,
          user = {
            username: username,
            provider: this.provider,
            auth: this.isAdmin ? 'admin' : 'write'
          };

        store.dispatch('startProgress', 'save');
        return postJSON(prefix + '/users', user)
          .then(() => store.dispatch('closePane'))
          .then(() => {
            store.dispatch('finishProgress', 'save');
            store.dispatch('showStatus', { type: 'save', message: `Added ${username} to all sites!` });
          }).catch((e) => {
            log.error(e.message, { action: 'createUser', username: user.username, provider: user.provider });
            store.dispatch('finishProgress', 'error');
            store.dispatch('showStatus', { type: 'error', message: `Error adding ${username} to Clay: ${e.message}` });
          });
      }
    },
    mounted() {
      // set default provider
      this.provider = _.head(this.providers);
    },
    components: {
      UiTextbox,
      UiSelect,
      UiSwitch,
      UiButton
    }
  };
</script>
