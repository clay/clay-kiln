<style lang="sass">
  .add-contributor {
    display: flex;
    flex-direction: column;
    // take up the full height of the screen,
    // since it needs to load async and we don't want it to jump
    height: calc(100vh - 88px);
  }

  .invite-filter {
    flex: 0 0 auto;
    padding: 16px 16px 0;
  }

  .invite-list {
    flex: 0 1 100%;
    padding: 16px 16px 0;
    overflow-y: scroll;
  }
</style>

<template>
  <div class="add-contributor">
    <ui-textbox class="invite-filter" v-model.trim="query" type="search" label="Search for Someone" :autofocus="true" :floatingLabel="true" ref="searchInput" @keydown="filterList"></ui-textbox>
    <keep-alive>
      <div class="invite-list">
        <person
          v-for="user in users"
          :key="user.username"
          :id="user.username"
          :image="user.imageUrl"
          :name="user.name"
          :subtitle="user.username"
          :hasPrimaryAction="true"
          :hasSecondaryAction="true"
          secondaryActionIcon="person_add"
          @primary-click="addPerson(user)"
          @secondary-click="addPerson(user)"></person>
      </div>
    </keep-alive>
  </div>
</template>

<script>
  import _ from 'lodash';
  import UiTextbox from 'keen/UiTextbox';
  import { postJSON } from '../core-data/api';
  import { searchRoute } from '../utils/references';
  import logger from '../utils/log';
  import person from '../utils/person.vue';

  const log = logger(__filename);

  function buildUserQuery(query) {
    const str = _.isString(query) && query.toLowerCase() || '';

    if (str !== '') {
      // allow filtering by name / username (weighing the names more than usernames)
      return {
        multi_match: {
          query: str,
          fields: ['name^2', 'username'],
          type: 'phrase_prefix' // use the prefix query here so we don't need to type in the full name to get matches
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
            users = _.map(hits, hit => hit._source);

          // set the filtered user data
          this.users = users;
        });
      },
      filterList: _.debounce(function () {
        this.fetchUsers();
      }, 300),
      addPerson(user) {
        const name = user.name || user.username;

        this.$store.dispatch('startProgress');
  
        return this.$store.dispatch('updatePageList', { user })
          .then(() => {
            this.$store.dispatch('finishProgress');
            this.$store.dispatch('showSnackbar', `Added ${name} to this page`); // todo: allow undoing this
  
            return this.$store.dispatch('closeModal');
          })
          .catch((e) => {
            log.error(`Error adding ${name} to page: ${e.message}`, { action: 'addPersonToPage' });
            store.dispatch('finishProgress');
            store.dispatch('showSnackbar', `Error adding ${name} to page`);
          });
      }
    },
    mounted() {
      return this.fetchUsers();
    },
    components: {
      UiTextbox,
      person
    }
  };
</script>
