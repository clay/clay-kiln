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
        const self = this;

        this.$store.dispatch('addComponents', {
          currentURI: this.args.currentURI,
          parentURI: this.args.parentURI,
          path: this.args.path,
          components: [{ name: id }]
        })
        .then(() => self.$nextTick(() => self.$store.dispatch('closePane')));
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
