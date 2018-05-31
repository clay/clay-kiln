<template>
  <filterable-list :content="components" :onClick="itemClick" label="Search visible components" headerTitle="Component" :onSettings="openSettings"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { refAttr, getComponentName } from '../utils/references';
  import { getVisibleList, isComponentInPage } from '../utils/component-elements';
  import label from '../utils/label';
  import filterableList from '../utils/filterable-list.vue';

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
        const selected = _.get(this.$store, 'state.ui.currentSelection'),
          isPageEditMode = _.get(this.$store, 'state.editMode') === 'page';

        return _.map(_.filter(getVisibleList(), (el) => {
          // only show page / layout components, depending on edit mode
          if (isPageEditMode) {
            return isComponentInPage(el.getAttribute(refAttr));
          } else {
            return !isComponentInPage(el.getAttribute(refAttr));
          }
        }), (el) => getName(el, selected));
      }
    },
    methods: {
      itemClick(id) {
        const el = find(`[${refAttr}="${id}"]`);

        this.$store.dispatch('select', el);
        this.$store.dispatch('scrollToComponent', el);
      },
      openSettings(id) {
        const el = find(`[${refAttr}="${id}"]`);

        this.$store.dispatch('select', el);
        this.$store.dispatch('scrollToComponent', el);
        this.$store.dispatch('focus', { uri: id, path: 'settings' });
      }
    },
    components: {
      'filterable-list': filterableList
    }
  };
</script>
