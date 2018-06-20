<style lang="sass">
  .new-page-nav {
    width: 400px;
  }
</style>

<template>
  <filterable-list v-if="isAdmin" class="new-page-nav" :content="pages" :secondaryActions="secondaryActions" filterLabel="Search Page Templates" :addTitle="addTitle" :addIcon="addIcon" header="Page Template" @child-action="itemClick" @add="addTemplate"></filterable-list>
  <filterable-list v-else  class="new-page-nav":content="pages" filterLabel="Search Page Templates" header="Page Template" @child-action="itemClick"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import { uriToUrl } from '../utils/urls';
  import { pagesRoute, htmlExt, editExt } from '../utils/references';
  import filterableList from '../utils/filterable-list.vue';

  export default {
    props: ['content'],
    data() {
      return {
        secondaryActions: [{
          icon: 'settings',
          tooltip: 'Edit Template',
          action: this.editTemplate
        }, {
          icon: 'delete',
          tooltip: 'Remove Template',
          action: this.removeTemplate
        }]
      };
    },
    computed: {
      isAdmin() {
        return _.get(this.$store, 'state.user.auth') === 'admin';
      },
      addTitle() {
        return _.get(this.$store, 'state.ui.metaKey') ? 'Duplicate Current Page' : 'Add Current Page To List';
      },
      addIcon() {
        return _.get(this.$store, 'state.ui.metaKey') ? 'plus_one' : 'add';
      },
      pages() {
        const pages = _.get(this.$store, 'state.lists[new-pages].items');

        return _.sortBy(pages, ['title', 'id']);
      }
    },
    methods: {
      itemClick(id, title) {
        this.$store.commit('CREATE_PAGE', title);
        return this.$store.dispatch('createPage', id).then((url) => window.location.href = url);
      },
      editTemplate(id) {
        const prefix = _.get(this.$store, 'state.site.prefix');

        window.location.href = uriToUrl(`${prefix}${pagesRoute}${id}${htmlExt}${editExt}`);
      },
      removeTemplate(id, title) {
        this.$store.dispatch('openConfirm', {
          title: 'Confirm Template Removal',
          text: `Remove the "${title}" template from this list? This cannot be undone.`,
          button: 'Yes, Remove Template',
          onConfirm: this.onDeleteConfirm.bind(this, id)
        });
      },
      onDeleteConfirm(id) {
        return this.$store.dispatch('updateList', { listName: 'new-pages', fn: (items) => {
          const category = _.find(items, (item) => _.find(item.children, (child) => child.id === id)),
            index = _.findIndex(category.children, (child) => child.id === id);

          category.splice(index, 1);
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
