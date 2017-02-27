<template>
  <filterable-list :content="components" :onClick="itemClick"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import dom from '@nymag/dom';
  import { refAttr, getComponentName } from '../lib/utils/references';
  import { getVisibleList } from '../lib/utils/component-elements';
  import label from '../lib/utils/label';
  import filterableList from './filterable-list.vue';

  /**
   * Get the name of the component
   *
   * @param  {[type]} el [description]
   * @return {[type]}    [description]
   */
  function getName(el) {
    var ref = el.getAttribute(refAttr);

    return {
      id: ref,
      title: label(getComponentName(ref))
    };
  }

  export default {
    props: [],
    data() {
      return {}
    },
    computed: {
      components() {
        return _.map(getVisibleList(), getName);
      }
    },
    methods: {
      itemClick(id) {
        console.log('Select component with URI:', id);
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
