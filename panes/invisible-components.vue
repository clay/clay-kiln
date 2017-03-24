<template>
  <filterable-list :content="list" :placeholder="placeholder" :onSettings="openSettings" :onDelete="removeComponent" :onReorder="reorderComponents"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { getSchema } from '../lib/core-data/components';
  import { getComponentName, refProp, refAttr } from '../lib/utils/references';
  import label from '../lib/utils/label';
  import filterableList from './filterable-list.vue';

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
      list() {
        // note: invisible components are currently only allowed in the layout data
        // todo: allow these in page data as well?
        return _.map(_.get(this.$store, `state.components['${this.args.uri}'].${this.args.path}`), formatComponents);
      },
      label() {
        return label(this.args.path, getSchema(this.args.uri, this.args.path));
      },
      placeholder() {
        return `Search ${this.label} components`;
      }
    },
    methods: {
      openSettings(id) {
        const path = 'settings';

        this.$store.dispatch('closePane');
        this.$store.dispatch('focus', { uri: id, path });
      },
      removeComponent(id) {
        const componentEl = find(`[${refAttr}="${id}"]`);

        this.$store.dispatch('removeComponent', componentEl);
      },
      reorderComponents(id, index, oldIndex) {
        let componentList = _.reduce(_.get(this.$store, `state.components['${this.args.uri}'].${this.args.path}`), (list, val) => list.concat({ [refProp]: val[refProp] }), []);

        componentList.splice(oldIndex, 1); // remove at the old index
        componentList.splice(index, 0, { [refProp]: id }); // add at the new index
        this.$store.dispatch('saveComponent', { uri: this.args.uri, data: { [this.args.path]: componentList }});
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
