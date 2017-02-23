<style lang="sass">


</style>

<template>
  <filterable-list :content="pages" :onClick="itemClick"></filterable-list>
</template>


<script>
  import _ from 'lodash';
  import { getJSON } from '../lib/core-data/api';
  import { uriToUrl } from '../lib/utils/urls';
  import filterableList from './filterable-list.vue';

  export default {
    props: ['content'],
    data() {
      return {}
    },
    asyncComputed: {
      pages() {
        // Get the JSON response from the API passed in
        return getJSON(`${uriToUrl(this.$store.state.site.prefix)}/lists/new-pages`);
      }
    },
    methods: {
      itemClick(id) {
        console.log('Create new page:', id);
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
