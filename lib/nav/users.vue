<style lang="sass">
  @import '../../styleguide/colors';

  .users-nav {
    display: flex;
    flex-direction: column;
    width: 400px;

    .users-input {
      flex: 0 0 auto;
      margin: 8px 16px;
    }

    .users-list {
      flex: 0 1 100%;
      overflow-y: scroll;
      overflow-x: hidden;
      padding: 0;
    }

    .person-item {
      padding: 12px 16px;
    }

    .add-user-wrapper {
      border-top: 1px solid $divider-color;
      flex: 0 0 auto;
      padding: 16px;

      .add-user-button {
        width: 100%;
      }
    }
  }
</style>

<template>
  <div class="users-nav">
    <ui-textbox
      v-model="query"
      class="users-input"
      label="Search Users"
      :floatingLabel="true"
      :autofocus="true"
      @input="filterList"></ui-textbox>
    <div class="users-list">
      <person
        v-for="(user, index) in users"
        :id="user.id"
        :image="user.imageUrl"
        :name="user.name"
        :subtitle="user.username"
        :hasToggle="true"
        :toggled="user.auth === 'admin'"
        :hasSecondaryAction="true"
        secondaryActionIcon="delete"
        :disabled="user.isCurrentUser"
        @toggle="toggleAdmin"
        @secondary-click="deleteUser"></person>
    </div>
    <div class="add-user-wrapper">
      <ui-button class="add-user-button" buttonType="button" type="primary" color="default" @click.stop="addUser">Invite To Clay</ui-button>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { postJSON, save, remove } from '../core-data/api';
  import { searchRoute } from '../utils/references';
  import person from '../utils/person.vue';
  import UiTextbox from 'keen/UiTextbox';
  import UiButton from 'keen/UiButton';

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
            from: 0,
            sort: [
              { name: { order: 'asc' }},
              { username: { order: 'asc' }}
            ]
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
      filterList: _.debounce(function () {
        this.fetchUsers();
      }, 300),
      // note: toggleAdmin is called when this loads, because of course it is
      toggleAdmin(id, val) {
        const prefix = _.get(this.$store, 'state.site.prefix'),
          index = _.findIndex(this.users, (user) => user.id === id),
          auth = this.users[index].auth;

        if (val && auth === 'write' || !val && auth === 'admin') {
          // changing auth!
          if (val) {
            // make them an admin!
            this.users[index].auth = 'admin';
          } else {
            this.users[index].auth = 'write';
          }

          return save(prefix + '/users/' + id, _.omit(this.users[index], ['id', 'isCurrentUser']));
        }
      },
      deleteUser(id) {
        const index = _.findIndex(this.users, (u) => u.id === id),
          username = this.users[index].username;

        this.$store.dispatch('openConfirm', {
          title: 'Confirm User Removal',
          text: `Remove ${username} from Clay? This cannot be undone.`,
          button: 'Yes, Remove User',
          onConfirm: this.onDeleteConfirm.bind(this, id, username, index)
        });
      },
      onDeleteConfirm(id, username, index) {
        const store = this.$store,
          prefix = _.get(store, 'state.site.prefix');

        this.users.splice(index, 1);
        return remove(prefix + '/users/' + id).then(() => {
          store.dispatch('showStatus', { type: 'save', message: `Removed ${username} from all sites!` });
        }).catch((e) => {
          store.dispatch('showStatus', { type: 'error', message: `Error removing ${username} from Clay: ${e.message}` });
        });
      },
      addUser() {
        return this.$store.dispatch('openModal', {
          title: 'Invite To Clay',
          type: 'add-user'
        });
      }
    },
    mounted() {
      this.fetchUsers();
    },
    components: {
      person,
      UiTextbox,
      UiButton
    }
  };
</script>
