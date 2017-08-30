<style lang="sass">


</style>

<template>
  <filterable-list v-if="isAdmin" :content="pages" :onClick="itemClick" placeholder="Search Page Templates" :onSettings="editTemplate" :onDelete="removeTemplate" :onAdd="addTemplate" :addTitle="addTitle"></filterable-list>
  <filterable-list v-else :content="pages" :onClick="itemClick" placeholder="Search Page Templates"></filterable-list>
</template>


<script>
  import _ from 'lodash';
  import { getObject } from '../lib/core-data/api';
  import { getItem, updateArray } from '../lib/utils/local';
  import { props } from '../lib/utils/promises';
  import filterableList from './filterable-list.vue';

  export default {
    props: ['content'],
    data() {
      return {};
    },
    computed: {
      isAdmin() {
        return _.get(this.$store, 'state.user.auth') === 'admin';
      },
      addTitle() {
        return _.get(this.$store, 'state.ui.metaKey') ? 'Create New Page From Current Page' : 'Add Current Page To List';
      }
    },
    asyncComputed: {
      pages() {
        return props({
          pages: getObject(`${this.$store.state.site.prefix}/lists/new-pages`),
          sortList: getItem(`newpages:${this.$store.state.site.slug}`)
        }).then(({ pages, sortList }) => {
          sortList = sortList || [];
          const sorted = _.intersectionBy(sortList, pages, 'id'),
            unsorted = _.differenceBy(pages, sortList, 'id');

          return sorted.concat(unsorted);
        });
      }
    },
    methods: {
      itemClick(id, title) {
        return updateArray(`newpages:${this.$store.state.site.slug}`, { id, title }, 'id')
          .then(() => this.$store.commit('CREATE_PAGE', title))
          .then(() => this.$store.dispatch('createPage', id))
          .then((url) => window.location.href = url);
      },
      editTemplate(id) {
        console.log('edit template:', id)
      },
      removeTemplate(id) {
        console.log('remove template:', id)
      },
      addTemplate() {
        const isMetaKeyPressed = _.get(this.$store, 'state.ui.metaKey');

        if (isMetaKeyPressed) {
          console.log('create new page from current page')
        } else {
          console.log('add current page')
        }
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
