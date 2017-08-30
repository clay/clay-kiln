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
  import { uriToUrl } from '../lib/utils/urls';
  import { pagesRoute, htmlExt, editExt } from '../lib/utils/references';
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
        const prefix = _.get(this.$store, 'state.site.prefix');

        window.location.href = uriToUrl(`${prefix}${pagesRoute}${id}${htmlExt}${editExt}`);
      },
      removeTemplate(id) {
        console.log('remove template:', id)
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
          return this.$store.dispatch('openPane', {
            title: 'Add Page Template',
            position: 'left',
            size: 'small',
            height: 'short',
            content: {
              component: 'add-page-to-list'
            }
          })
        }
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
