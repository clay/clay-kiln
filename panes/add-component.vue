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

        this.$store.dispatch('createComponent', { name: id })
          .then((uri) => {
            return self.$store.dispatch('addComponent', {
              currentURI: self.args.currentURI,
              parentURI: self.args.parentURI,
              path: self.args.path,
              uri
            });
          })
          .then(() => self.$nextTick(() => self.$store.dispatch('closePane')));
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
