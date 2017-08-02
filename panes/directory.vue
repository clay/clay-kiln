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

      .user-name {
        @include primary-text();

        border: none;
        flex: 1 0 auto;
        line-height: 1.4;
        padding-right: 0 15px;
        // no left padding (it's handled by the image),
        // so name displays to the left if image doesn't exist
        text-align: left;
      }

      .user-admin-toggle {
        @include input-label();

        align-items: center;
        color: $published;
        cursor: pointer;
        display: flex;
        flex: 0 0 auto;
        font-size: 10px;
        justify-content: flex-end;
        line-height: 10px;
        padding: 15px;
        text-align: right;
        text-transform: uppercase;

        .user-admin-checkbox {
          height: 16px;
          margin-left: 5px;
          width: 16px;
        }
      }

      .user-delete {
        border: none;
        border-left: 1px solid $pane-list-divider;
        padding: 14px 4px 14px 17px;
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
        v-model="query">
    </div>
    <div class="directory-pane-readout">
      <ul class="directory-pane-readout-list" ref="list">
        <li v-for="user in users" class="directory-pane-item">
          <img v-if="user.imageUrl" class="user-image" :src="user.imageUrl" />
          <span class="user-name">{{ user.name }}</span>
          <label class="user-admin-toggle">
            <span v-if="user.auth === 'admin'">admin</span>
            <input type="checkbox" class="user-admin-checkbox" :checked="user.auth === 'admin'" @change="toggleAdmin(user.username)" />
          </label>
          <button type="button" class="user-delete" title="Remove person from Clay" @click.stop="deleteUser(user.username)">
            <icon name="delete"></icon>
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
  import icon from '../lib/utils/icon.vue';

  export default {
    data() {
      return {
        query: ''
      };
    },
    computed: {
      users() {
        return [{
          auth: 'admin',
          imageUrl: 'https://lh4.googleusercontent.com/-b5fpu7SlP28/AAAAAAAAAAI/AAAAAAAAACI/HHLG02wfBBs/photo.jpg?sz=50',
          name: 'Nelson Pecora',
          provider: 'google',
          username: 'nelson.pecora@nymag.com'
        }, {
          auth: 'write',
          name: 'Samuel Clemens',
          provider: 'google',
          username: 'mark.twain@nymag.com'
        }];
      }
    },
    methods: {
      toggleAdmin(username) {
        console.log('toggle admin:', username)
      },
      deleteUser(username) {
        const confirm = window.confirm(`Delete ${username}? This cannot be undone.`);

        if (confirm) {
          console.log('delete:', username)
        }
      },
      openAddUser() {
        console.log('add user pane')
      }
    },
    components: {
      icon
    }
  };
</script>
