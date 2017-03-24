<template>
  <filterable-list :content="components" :placeholder="placeholder" :onSettings="openSettings" :onDelete="removeComponent"></filterable-list>
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
      components() {
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
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
