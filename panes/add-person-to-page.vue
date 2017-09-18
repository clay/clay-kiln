<style lang="sass">
  @import '../styleguide/inputs';
  @import '../styleguide/colors';
  @import '../styleguide/buttons';
  @import '../styleguide/typography';

  // add-person-to-page is very similar to directory, but with fewer features
  .add-person-to-page-pane {
    height: calc(100% - 51px);

    &-input {
      padding: 4px;
      &-field {
        @include input();

        padding: 10px 14px;
      }
    }

    &-readout {
      overflow-y: scroll;
      overflow-x: hidden;
      // height is pane height minus search box and bottom button area
      height: calc(100% - 134px);
      padding: 0 18px 18px;

      &-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
    }

    &-item {
      align-items: center;
      border-bottom: 1px solid $pane-list-divider;
      cursor: pointer;
      display: flex;
      min-height: 53px;

      .user-image {
        flex: 0 0 32px;
        height: 32px;
        margin-right: 15px;
        width: 32px;
      }

      .user-name,
      .user-name-empty {
        @include primary-text();

        border: none;
        flex: 1 0 auto;
        line-height: 1.4;
        padding-right: 0 15px;
        // no left padding (it's handled by the image),
        // so name displays to the left if image doesn't exist
        text-align: left;
      }

      .user-name-empty {
        @include tertiary-text();
      }
    }
  }
</style>

<template>
  <div class="add-person-to-page-pane">
    <div class="add-person-to-page-pane-input">
      <input
        type="text"
        class="add-person-to-page-pane-input-field"
        placeholder="Search for someone"
        ref="search"
        v-model="query"
        @keyup="onSearchKeyup">
    </div>
    <div class="add-person-to-page-pane-readout">
      <ul class="add-person-to-page-pane-readout-list" ref="list">
        <li v-for="(user, index) in users" class="add-person-to-page-pane-item" @click.stop.prevent="addPersonToPage(user)">
          <img v-if="user.imageUrl" class="user-image" :src="user.imageUrl" />
          <span v-if="user.name" class="user-name">{{ user.name }}</span>
          <span v-else class="user-name-empty">{{ user.username }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { postJSON } from '../lib/core-data/api';
  import { searchRoute } from '../lib/utils/references';

  function buildUserQuery(query) {
    const str = _.isString(query) && query.toLowerCase() || '';

    if (str !== '') {
      // allow filtering by name / username (weighing the names more than usernames)
      return {
        multi_match: {
          query: str,
          fields: ['name^2', 'username']
        }
      };
    } else {
      // list all users
      return {
        match_all: {}
      };
    }
  }

  export default {
    data() {
      return {
        query: '',
        users: []
      };
    },
    methods: {
      fetchUsers() {
        const query = this.query,
          prefix = _.get(this.$store, 'state.site.prefix');

        return postJSON(prefix + searchRoute, {
          index: 'users',
          type: 'general',
          body: {
            query: buildUserQuery(query),
            size: 500, // todo: paginate this once we redesign the clay menu (use the same pagination UI)
            from: 0
          }
        }).then((res) => {
          const hits = _.get(res, 'hits.hits') || [],
            users = _.map(hits, (hit) => hit._source);

          // set the filtered user data
          this.users = users;
        });
      },
      onSearchKeyup: _.debounce(function () {
        this.fetchUsers();
      }, 300),
      addPersonToPage(user) {
        this.$store.dispatch('startProgress', 'save');
        return this.$store.dispatch('updatePageList', { user })
          .then(() => {
            this.$store.dispatch('finishProgress', 'save');
            this.$store.dispatch('showStatus', { type: 'save', message: `Added ${user.username} to this page!` });
            return this.$store.dispatch('closePane');
          })
          .catch((e) => {
            console.error(e);
            store.dispatch('finishProgress', 'error');
            store.dispatch('showStatus', { type: 'error', message: `Error adding ${user.username} to page: ${e.message}` });
          });
      }
    },
    mounted() {
      const input = find(this.$el, '.add-person-to-page-pane-input-field');

      input.focus();
      return this.fetchUsers();
    }
  };
</script>
