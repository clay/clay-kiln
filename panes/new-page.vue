<style lang="sass">


</style>

<template>
  <filterable-list :content="pages" :onClick="itemClick" placeholder="Search Page Templates"></filterable-list>
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
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
