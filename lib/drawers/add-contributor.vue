<style lang="sass">
  .add-contributor {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .invite-filter {
    flex: 0 0 auto;
  }

  .invite-list {
    flex: 1 0 auto;
    overflow-y: scroll;
  }
</style>

<template>
  <div class="add-contributor">
    <ui-textbox class="invite-filter" v-model="query" type="search" label="Search for Someone" :autofocus="true" :floatingLabel="true" ref="searchInput" @keydown="filterList"></ui-textbox>
    <div class="invite-list">
      <person
        v-for="user in users"
        :id="user.username"
        :image="user.imageUrl"
        :name="user.name"
        :subtitle="user.username"
        :hasPrimaryAction="true"
        :hasSecondaryAction="true"
        secondaryActionIcon="person_add"
        @primary-click="addPerson"
        @secondary-click="addPerson"></person>
    </div>
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
      filterList: _.debounce(function () {
        this.fetchUsers();
      }, 300),
      addPerson(user) {
        this.$store.dispatch('startProgress');
        return this.$store.dispatch('updatePageList', { user })
          .then(() => {
            this.$store.dispatch('finishProgress');
            this.$store.dispatch('showStatus', { type: 'save', message: `Added ${user.username} to this page!` });
            return this.$store.dispatch('closePane');
          })
          .catch((e) => {
            log.error(e.message, { action: 'addPersonToPage' });
            store.dispatch('finishProgress');
            store.dispatch('showStatus', { type: 'error', message: `Error adding ${user.username} to page: ${e.message}` });
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
