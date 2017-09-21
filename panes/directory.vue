<style lang="sass">
  @import '../styleguide/inputs';
  @import '../styleguide/colors';
  @import '../styleguide/buttons';
  @import '../styleguide/typography';

  // directory-pane styles are a combination of filterable-list, people pane, and the publish button
  .directory-pane {
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
      display: flex;
      min-height: 53px;

      button {
        appearance: none;
        background: transparent;
        cursor: pointer;

        &:focus {
          outline: none;
        }
      }

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

      .user-admin-toggle {
        @include input-label();

        align-items: center;
        color: $label;
        cursor: pointer;
        display: flex;
        flex: 0 0 auto;
        font-size: 10px;
        justify-content: flex-end;
        line-height: 10px;
        padding: 15px;
        text-align: right;
        text-transform: uppercase;

        &.disabled {
          cursor: not-allowed;
        }

        .user-admin-checkbox {
          height: 16px;
          margin-left: 5px;
          width: 16px;

          &:disabled {
            cursor: not-allowed;
          }
        }
      }

      .user-delete {
        border: none;
        border-left: 1px solid $pane-list-divider;
        padding: 14px 4px 14px 17px;

        &:disabled {
          cursor: not-allowed;

          svg,
          svg * {
            fill: $button-disabled;
          }
        }
      }
    }

    .directory-pane-add {
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
  <div class="directory-pane">
    <div class="directory-pane-input">
      <input
        type="text"
        class="directory-pane-input-field"
        placeholder="Search for someone"
        ref="search"
        v-model="query"
        @keyup="onSearchKeyup">
    </div>
    <div class="directory-pane-readout">
      <ul class="directory-pane-readout-list" ref="list">
        <li v-for="(user, index) in users" class="directory-pane-item">
          <img v-if="user.imageUrl" class="user-image" :src="user.imageUrl" />
          <span v-if="user.name" class="user-name">{{ user.name }}</span>
          <span v-else class="user-name-empty">{{ user.username }}</span>
          <label class="user-admin-toggle" :class="{ 'disabled': user.isCurrentUser }">
            <span v-if="user.auth === 'admin'">admin</span>
            <input type="checkbox" class="user-admin-checkbox" :checked="user.auth === 'admin'" :disabled="user.isCurrentUser" @change="toggleAdmin(user.id, user.auth, index)" />
          </label>
          <button type="button" class="user-delete" title="Remove person from Clay" :disabled="user.isCurrentUser" @click.stop="deleteUser(user.id, user.username, index)">
            <ui-icon icon="delete"></ui-icon>
          </button>
        </li>
      </ul>
    </div>
    <div class="directory-pane-add">
      <button type="button" class="directory-pane-add-button" @click.stop="openAddUser">Add Person</button>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { postJSON, save, remove } from '../lib/core-data/api';
  import { searchRoute } from '../lib/utils/references';
  import UiIcon from 'keen-ui/src/UiIcon.vue';

  function buildUserQuery(query) {
    const str = _.isString(query) && query.toLowerCase() || '';

    if (str === 'admin' || str === 'write') {
      // allow filtering by ONLY admins or non-admins
      return {
        term: {
          auth: str
        }
      };
    } else if (str !== '') {
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
          prefix = _.get(this.$store, 'state.site.prefix'),
          current = _.get(this.$store, 'state.user');

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
            users = _.map(hits, (hit) => {
              const src = hit._source;

              return {
                id: hit._id, // PUT to prefix + /users/ + id to update user (e.g. to toggle admin)
                username: src.username,
                provider: src.provider,
                auth: src.auth,
                imageUrl: src.imageUrl,
                name: src.name,
                isCurrentUser: src.username === current.username && src.provider === current.provider
              };
            });

          // set the filtered user data
          this.users = users;
        });
      },
      onSearchKeyup: _.debounce(function () {
        this.fetchUsers();
      }, 300),
      toggleAdmin(id, auth, index) {
        const prefix = _.get(this.$store, 'state.site.prefix');

        if (auth === 'write') {
          // make them an admin!
          this.users[index].auth = 'admin';
        } else {
          this.users[index].auth = 'write';
        }

        return save(prefix + '/users/' + id, _.omit(this.users[index], ['id', 'isCurrentUser']));
      },
      deleteUser(id, username, index) {
        const store = this.$store,
          prefix = _.get(store, 'state.site.prefix'),
          confirm = window.confirm(`Remove ${username} from Clay? This cannot be undone.`); // eslint-disable-line

        if (confirm) {
          store.dispatch('startProgress', 'save');
          this.users.splice(index, 1);
          return remove(prefix + '/users/' + id).then(() => {
            store.dispatch('finishProgress', 'save');
            store.dispatch('showStatus', { type: 'save', message: `Removed ${username} from all sites!` });
          }).catch((e) => {
            store.dispatch('finishProgress', 'error');
            store.dispatch('showStatus', { type: 'error', message: `Error removing ${username} from Clay: ${e.message}` });
          });
        }
      },
      openAddUser() {
        this.$store.dispatch('openPane', {
          title: 'Add Person',
          position: 'left',
          size: 'small',
          height: 'add-person-height', // add-person has a specific custom height
          content: {
            component: 'add-person'
          }
        });
      }
    },
    mounted() {
      const input = find(this.$el, '.directory-pane-input-field');

      input.focus();
      return this.fetchUsers();
    },
    components: {
      UiIcon
    }
  };
</script>
