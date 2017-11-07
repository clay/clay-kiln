<template>
  <filterable-list :content="list" :onSettings="openSettings" :onDelete="removeComponent" :onReorder="reorderComponents" :addTitle="addTitle" :onAdd="openAddComponent" headerTitle="Component"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { getComponentName, refProp, refAttr } from '../utils/references';
  import label from '../utils/label';
  import filterableList from '../utils/filterable-list.vue';

  /**
   * Get the name of the component
   *
   * @param  {object} component
   * @return {object}
   */
  function formatComponents(component) {
    const uri = component[refProp];

    return {
      id: uri,
      title: label(getComponentName(uri))
    };
  }

  export default {
    props: ['args'],
    data() {
      return {};
    },
    computed: {
      uri() {
        return _.get(this.$store, 'state.page.data.layout');
      },
      path() {
        return this.args.path;
      },
      schema() {
        return this.args.schema;
      },
      list() {
        // note: invisible components are currently only allowed in the layout data
        // todo: allow these in page data as well?
        return _.map(_.get(this.$store, `state.components['${this.uri}'].${this.path}`), formatComponents);
      },
      addTitle() {
        return `Add to ${label(this.path, this.schema)}`;
      }
    },
    methods: {
      openSettings(id) {
        const path = 'settings';

        this.$store.dispatch('focus', { uri: id, path });
      },
      removeComponent(id) {
        const componentEl = find(`[${refAttr}="${id}"]`);

        this.$store.dispatch('removeComponent', componentEl);
      },
      reorderComponents(id, index, oldIndex) {
        let componentList = _.reduce(_.get(this.$store, `state.components['${this.uri}'].${this.path}`), (list, val) => list.concat({ [refProp]: val[refProp] }), []);

        componentList.splice(oldIndex, 1); // remove at the old index
        componentList.splice(index, 0, { [refProp]: id }); // add at the new index
        this.$store.dispatch('saveComponent', { uri: this.uri, data: { [this.path]: componentList }});
      },
      openAddComponent() {
        this.$store.dispatch('openAddComponent', { parentURI: this.uri, path: this.path });
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
