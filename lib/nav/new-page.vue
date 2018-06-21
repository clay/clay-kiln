<style lang="sass">
  .new-page-nav {
    width: 400px;
  }
</style>

<template>
  <filterable-list v-if="isAdmin" class="new-page-nav" :content="pages" :secondaryActions="secondaryActions" :initialExpanded="initialExpanded" filterLabel="Search Page Templates" :addTitle="addTitle" :addIcon="addIcon" header="Page Template" @child-action="itemClick" @add="addTemplate"></filterable-list>
  <filterable-list v-else  class="new-page-nav":content="pages" :initialExpanded="initialExpanded" filterLabel="Search Page Templates" header="Page Template" @child-action="itemClick"></filterable-list>
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
      initialExpanded() {
        // the page list will open to the last used category. this is:
        // 1. the category that the last page was created from
        // 2. the category that the last page was added to
        // 3. the category that the last page was removed from
        // this provides a more seamless edit experience with less clicking around
        // for common actions, and allows users to immediately view the results
        // of their (adding / removing) actions
        return _.get(this.$store, 'state.ui.favoritePageCategory');
      },
      pages() {
        let items = _.cloneDeep(_.get(this.$store, 'state.lists[new-pages].items', []));

        if (!items || !_.isObject(_.head(items)) || !_.head(items).children) {
          // no categories, so put all pages in a General category before rendering them
          items = [{
            id: 'general',
            title: 'General',
            children: _.sortBy(items, ['title', 'id'])
          }];
        } else {
          // categories are already set up, so sort them and their children
          // note: we're doing this every time to take into account bootstraps and manual changes to the new-pages list
          items = _.sortBy(items, ['title', 'id']);
          _.each(items, (item) => {
            item.children = _.sortBy(item.children, ['title', 'id']);
          });
        }

        return items;
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
        let currentCategoryID;

        return this.$store.dispatch('updateList', { listName: 'new-pages', fn: (items) => {
          let currentCategoryIndex = _.findIndex(items, (item) => _.find(item.children, (child) => child.id === id)),
            currentCategory = items[currentCategoryIndex],
            currentIndex = _.findIndex(currentCategory.children, (child) => child.id === id);

          // remove page from the category it's inside
          currentCategory.children.splice(currentIndex, 1);

          // set the category that should be expanded after we save this
          // note: the category may be removed (below) if the last child is removed
          currentCategoryID = currentCategory.id;

          // if the category doesn't contain any children anymore, remove it
          if (_.isEmpty(currentCategory.children)) {
            items.splice(currentCategoryIndex, 1);
          }

          return items;
        }}).then(() => this.$store.commit('CHANGE_FAVORITE_PAGE_CATEGORY', currentCategoryID));
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
