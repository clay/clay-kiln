<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/inputs';
  @import '../styleguide/buttons';

  .add-person {
    padding: 17px;

    .add-person-label {
      @include input-label();

      display: flex;
      flex-flow: column nowrap;
      margin-bottom: 20px;

      &.add-person-admin {
        flex-flow: row nowrap;
      }
    }

    .add-person-input {
      @include input();

      flex: 1 1 auto;
      margin: 10px 0 0;
    }

    .add-person-select {
      @include select();
      @include primary-text();

      background-color: $input-background;
      border: 1px solid $input-border;
      border-radius: 0;
      box-shadow: inset 0 1px 2px 0 $input-shadow;
      flex: 1 1 auto;
      height: 48px;
      margin: 10px 0 0;

      &:disabled {
        color: $input-disabled-text;
      }
    }

    .add-person-admin-toggle {
      height: 16px;
      margin-right: 5px;
      width: 16px;
    }

    .add-person-info {
      @include primary-text();
    }

    .add-person-create {
      border-top: 1px solid $pane-border;
      bottom: 0;
      left: 0;
      padding: 15px;
      position: absolute;
      width: 100%;

      &-button {
        @include button-outlined($published);

        height: auto;
        font-size: 16px;
        margin: 0;
        padding: 15px 0;
        width: 100%;
      }
    }
  }
</style>

<template>
  <div class="add-person">
    <label class="add-person-label">
      Username
      <input class="add-person-input" v-model="username"></input>
    </label>

    <label class="add-person-label">
      Provider
      <select class="add-person-select" :disabled="providers.length === 1" v-model="provider">
        <option v-for="provider in providers" :value="provider.value">{{ provider.text }}</option>
      </select>
    </label>

    <label class="add-person-label add-person-admin">
      <input type="checkbox" class="add-person-admin-toggle" v-model="isAdmin"></input>
      Admin
    </label>

    <div class="add-person-info">While <em>all</em> accounts can edit, only admins can manage users, create and edit page templates, and change permissions.</div>

    <div class="add-person-create">
      <button type="button" class="add-person-create-button" :disabled="username === ''" @click.stop="createUser">Create Account</button>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { postJSON } from '../lib/core-data/api';

  export default {
    data() {
      return {
        username: '',
        provider: 'google',
        isAdmin: false
      };
    },
    computed: {
      providers() {
        return _.reduce(_.get(this.$store, 'state.site.providers'), (results, provider) => {
          if (provider !== 'apikey') {
            results.push({
              value: provider,
              text: _.startCase(provider)
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
            console.error(e);
            store.dispatch('finishProgress', 'error');
            store.dispatch('showStatus', { type: 'error', message: `Error adding ${username} to Clay: ${e.message}` });
          });
      }
    }
  };
</script>
