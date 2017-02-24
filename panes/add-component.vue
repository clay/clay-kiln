<template>
  <filterable-list :content="components" :onClick="itemClick"></filterable-list>
</template>


<script>
  import _ from 'lodash';
  import label from '../lib/utils/label';
  import filterableList from './filterable-list.vue';

  /**
   * Turn a list of component strings into the objects
   * required by the `filterable list` component. Also
   * prettify the names of the components using the label
   * utility
   * @param  {Array} content
   * @return {Array}
   */
  function formatForFilterableList(content) {
    return _.map(content, item => {
      return {
        id: item,
        title: label(item)
      }
    });
  }

  export default {
    props: ['content'],
    data() {
      return {}
    },
    computed: {
      components() {
        return formatForFilterableList(this.content);
      }
    },
    methods: {
      itemClick(id) {
        console.log('Create add component:', id);
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
