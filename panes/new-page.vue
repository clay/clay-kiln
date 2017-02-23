<style lang="sass">


</style>

<template>
  <filterable-list :content="content" :onClick="itemClick"></filterable-list>
</template>


<script>
  import _ from 'lodash';
  import filterableList from './filterable-list.vue';

  export default {
    props: ['content'],
    data() {
      return {}
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
