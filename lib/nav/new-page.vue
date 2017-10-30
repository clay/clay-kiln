<style lang="sass">
  .new-page-nav {
    width: 400px;
  }
</style>

<template>
  <filterable-list v-if="isAdmin" class="new-page-nav" :content="pages" :onClick="itemClick" label="Search Page Templates" :onSettings="editTemplate" settingsTitle="Edit Template" :onDelete="removeTemplate" :onAdd="addTemplate" :addTitle="addTitle" headerTitle="Page Template"></filterable-list>
  <filterable-list v-else  class="new-page-nav":content="pages" :onClick="itemClick" label="Search Page Templates" headerTitle="Page Template"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import { getItem, updateArray } from '../utils/local';
  import { uriToUrl } from '../utils/urls';
  import { pagesRoute, htmlExt, editExt } from '../utils/references';
  import filterableList from '../utils/filterable-list.vue';

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
        return _.get(this.$store, 'state.ui.metaKey') ? 'Duplicate Current Page' : 'Add Current Page To List';
      }
    },
    asyncComputed: {
      pages() {
        const pages = _.get(this.$store, 'state.lists[new-pages].items');

        return getItem(`newpages:${this.$store.state.site.slug}`).then((sortList) => {
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
        const prefix = _.get(this.$store, 'state.site.prefix');

        window.location.href = uriToUrl(`${prefix}${pagesRoute}${id}${htmlExt}${editExt}`);
      },
      removeTemplate(id) {
        const title = _.find(this.pages, (page) => page.id === id).title;

        this.$store.dispatch('openConfirm', {
          title: 'Confirm Template Removal',
          text: `Remove the "${title}" template from this list? This cannot be undone.`,
          button: 'Yes, Remove Template',
          onConfirm: this.onDeleteConfirm.bind(this, id)
        });
      },
      onDeleteConfirm(id) {
        return this.$store.dispatch('updateList', { listName: 'new-pages', fn: (items) => {
          const index = _.findIndex(items, (item) => item.id === id);

          items.splice(index, 1);
          return items;
        }});
      },
      addTemplate() {
        const isMetaKeyPressed = _.get(this.$store, 'state.ui.metaKey'),
          uri = _.get(this.$store, 'state.page.uri'),
          currentPageID = uri.match(/pages\/([A-Za-z0-9\-]+)/)[1];

        if (isMetaKeyPressed) {
          this.$store.commit('CREATE_PAGE', currentPageID);
          return this.$store.dispatch('createPage', currentPageID)
            .then((url) => window.location.href = url);
        } else {
          this.$store.dispatch('openModal', {
            title: 'Add Page Template',
            type: 'add-page'
          });
        }
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
