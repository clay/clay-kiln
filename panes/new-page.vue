<style lang="sass">


</style>

<template>
  <filterable-list :content="pages" :onClick="itemClick"></filterable-list>
</template>


<script>
  import { getObject } from '../lib/core-data/api';
  import filterableList from './filterable-list.vue';

  export default {
    props: ['content'],
    data() {
      return {};
    },
    asyncComputed: {
      pages() {
        // Get the JSON response from the API passed in
        return getObject(`${this.$store.state.site.prefix}/lists/new-pages`);
      }
    },
    methods: {
      itemClick(id) {
        this.$store.dispatch('createPage', id).then((url) => window.location.href = url);
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
