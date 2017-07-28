<template>
  <filterable-list :content="components" :onClick="itemClick" :addTitle="fuzzyTitle" :onAdd="fuzzyAdd"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import label from '../lib/utils/label';
  import filterableList from './filterable-list.vue';

  function openAllComponents() {
    this.$store.dispatch('openPane', {
      title: 'All Components',
      position: 'right',
      height: 'medium-height',
      content: {
        component: 'add-component',
        args: {
          currentURI: this.args.currentURI,
          parentURI: this.args.parentURI,
          path: this.args.path,
          available: this.args.allComponents
        }
      }
    });
  }

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
      },
      fuzzyTitle() {
        return this.args.isFuzzy ? 'View All Components' : null;
      },
      fuzzyAdd() {
        return this.args.isFuzzy ? openAllComponents.bind(this) : null;
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
