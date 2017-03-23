<template>
  <filterable-list :content="components" :placeholder="placeholder" :onSettings="openSettings" :onDelete="removeComponent"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { getData, getSchema } from '../lib/core-data/components';
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
      return {
        list: getData(this.args.uri, this.args.path)
      };
    },
    computed: {
      components() {
        return _.map(this.list, formatComponents);
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
        const componentEl = find(`[${refAttr}="${id}"]`),
          list = this.list;

        console.log(componentEl)
        this.$store.dispatch('removeComponent', componentEl).then(() => {
          _.remove(list, (item) => item.id === id);
        });
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
