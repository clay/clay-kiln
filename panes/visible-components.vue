<template>
  <filterable-list :content="components" :onClick="itemClick" placeholder="Search visible components"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { refAttr, getComponentName } from '../lib/utils/references';
  import { getVisibleList } from '../lib/utils/component-elements';
  import label from '../lib/utils/label';
  import filterableList from './filterable-list.vue';

  /**
   * Get the name of the component
   *
   * @param  {Element} el
   * @param {Element} selected
   * @return {object}
   */
  function getName(el, selected) {
    const uri = el.getAttribute(refAttr);

    let obj = {
      id: uri,
      title: label(getComponentName(uri))
    };

    if (el === selected) {
      obj.selected = true;
    }

    return obj;
  }

  export default {
    props: [],
    data() {
      return {};
    },
    computed: {
      components() {
        const selected = _.get(this.$store, 'state.ui.currentSelection');

        return _.map(getVisibleList(), (el) => getName(el, selected));
      }
    },
    methods: {
      itemClick(id) {
        const el = find(`[${refAttr}="${id}"]`);

        this.$store.dispatch('select', el);
        this.$store.dispatch('scrollToComponent', el);
        this.$store.dispatch('closePane');
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
