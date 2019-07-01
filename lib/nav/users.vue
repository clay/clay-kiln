<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .users-nav {
    display: flex;
    flex-direction: column;
    width: 400px;

    .users-input {
      flex: 0 0 auto;
      margin: 16px;
    }

    .users-headers {
      @include type-list-header();

      align-items: center;
      background-color: $md-grey-50;
      border-top: 1px solid $divider-color;
      display: flex;
      flex: 0 0 auto;
      padding: 8px 16px;

      .users-header {
        &-name {
          flex: 0 1 100%;
          padding-left: 56px;
        }

        &-admin {
          flex: 0 0 36px;
        }

        &-remove {
          flex: 0 0 36px;
        }
      }
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
      v-model.trim="query"
      class="users-input"
      label="Search Users"
      :floatingLabel="true"
      :autofocus="true"
      @input="filterList"></ui-textbox>
    <div class="users-headers">
      <span class="users-header users-header-name">User Info</span>
      <span class="users-header users-header-admin">Admin</span>
      <span class="users-header users-header-remove"><!-- self explanatory --></span>
    </div>
    <div class="users-list">
      <person
        v-for="(user) in users"
        :key="user.id"
        :id="user.id"
        :image="user.imageUrl"
        :name="user.name"
        :subtitle="user.username"
        :hasToggle="true"
        :toggled="user.auth === 'admin'"
        :hasSecondaryAction="true"
        secondaryActionIcon="delete"
        :disabled="user.isCurrentUser"
        toggleTitle="Toggle Admin"
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
  import { searchRoute, usersRoute, usersBareRoute } from '../utils/references';
  import logger from '../utils/log';
  import person from '../utils/person.vue';
  import UiTextbox from 'keen/UiTextbox';
  import UiButton from 'keen/UiButton';

  const log = logger(__filename);

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
          body: {
            query: buildUserQuery(query),
            size: 500, // todo: paginate this once we redesign the clay menu (use the same pagination UI)
            from: 0,
            sort: [
              { name: { order: 'asc' } },
              { username: { order: 'asc' } }
            ]
          }
        }).then((res) => {
          const hits = _.get(res, 'hits.hits') || [],
            users = _.map(hits, (hit) => {
              const src = hit._source;

              return {
                id: hit._id, // PUT to prefix + /_users/ + id to update user (e.g. to toggle admin)
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
          index = _.findIndex(this.users, user => user.id === id),
          auth = this.users[index].auth;

        if (val && auth === 'write' || !val && auth === 'admin') {
          // changing auth!
          if (val) {
            // make them an admin!
            this.users[index].auth = 'admin';
          } else {
            this.users[index].auth = 'write';
          }

          return save(prefix + usersRoute + id, _.omit(this.users[index], ['id', 'isCurrentUser']));
        }
      },
      deleteUser(id) {
        const index = _.findIndex(this.users, u => u.id === id),
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
  
        return remove(prefix + usersRoute + id).then((oldUser) => {
          store.dispatch('showSnackbar', {
            message: `Removed ${username} from Clay`,
            action: 'Undo',
            onActionClick: () => postJSON(prefix + usersBareRoute, oldUser)
          });
        }).catch((e) => {
          log.error(`Error removing ${username} from Clay: ${e.message}`, { action: 'onDeleteConfirm' });
          store.dispatch('showSnackbar', `Error removing ${username} from Clay`);
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
