<template>
  <filterable-list :content="components" :onClick="itemClick" :addTitle="fuzzyTitle" :onAdd="fuzzyAdd"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import label from '../lib/utils/label';
  import { getItem, updateArray } from '../lib/utils/local';
  import { getComponentName } from '../lib/utils/references';
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
      fuzzyTitle() {
        return this.args.isFuzzy ? 'View All Components' : null;
      },
      fuzzyAdd() {
        return this.args.isFuzzy ? openAllComponents.bind(this) : null;
      }
    },
    asyncComputed: {
      components() {
        const parentName = getComponentName(this.args.parentURI),
          path = this.args.path,
          available = _.map(this.args.available, (component) => {
            return {
              id: component,
              title: label(component)
            };
          });

        return getItem(`addcomponents:${parentName}.${path}`).then((sortList) => {
          sortList = sortList || []; // initialize if it doesn't exist
          const sortedComponents = _.intersectionWith(sortList, available, (val, otherVal) => {
              return _.isObject(val) && _.isObject(otherVal) && val.name === otherVal.id;
            }),
            unsortedComponents = _.differenceWith(available, sortList, (val, otherVal) => {
              return val.id === otherVal.name;
            });

          return _.map(sortedComponents, (component) => {
            return {
              id: component.name,
              title: label(component.name)
            };
          }).concat(unsortedComponents);
        });
      }
    },
    methods: {
      itemClick(id) {
        const self = this,
          parentName = getComponentName(this.args.parentURI),
          path = this.args.path;

        return updateArray(`addcomponents:${parentName}.${path}`, { name: id })
          .then(() => {
            return this.$store.dispatch('addComponents', {
              currentURI: this.args.currentURI,
              parentURI: this.args.parentURI,
              path,
              components: [{ name: id }]
            })
            .then(() => self.$nextTick(() => self.$store.dispatch('closePane')));
          });
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
