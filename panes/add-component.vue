<template>
  <filterable-list :content="components" :onClick="itemClick"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import label from '../lib/utils/label';
  import filterableList from './filterable-list.vue';


  export default {
    props: ['args'],
    data() {
      return {};
    },
    computed: {
      components() {
        return _.map(this.args.available, (component) => {
          return {
            id: component,
            title: label(component)
          }; // todo: add fuzzy list
        });
      }
    },
    methods: {
      itemClick(id) {
        console.log(`add component: ${id} to ${this.args.path} in ${this.args.parentURI}`)
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
