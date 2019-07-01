<template>
  <filterable-list :content="components" :secondaryActions="secondaryActions" filterLabel="Search Visible Components" header="Component" @root-action="itemClick"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { refAttr, getComponentName } from '../utils/references';
  import { getVisibleList, isComponentInPage } from '../utils/component-elements';
  import label from '../utils/label';
  import filterableList from '../utils/filterable-list.vue';
  import { has as hasGroup } from '../core-data/groups';

  /**
   * Get the name of the component
   *
   * @param  {string} uri
   * @param {object} selected
   * @return {object}
   */
  function getName(uri, selected) {
    return {
      id: uri,
      title: label(getComponentName(uri)),
      selected: selected && uri === selected.uri
    };
  }

  export default {
    props: [],
    data() {
      return {
        secondaryActions: [{
          icon: 'settings',
          tooltip: id => `${label(getComponentName(id))} Settings`,
          action: this.openSettings,
          enable: id => hasGroup(id, 'settings')
        }]
      };
    },
    computed: {
      components() {
        const selected = _.get(this.$store, 'state.ui.currentSelection'),
          isPageEditMode = _.get(this.$store, 'state.editMode') === 'page';

        return _.map(_.filter(getVisibleList(), (el) => {
          const uri = el.getAttribute(refAttr);

          // only show page / layout components, depending on edit mode
          if (isPageEditMode) {
            return isComponentInPage(uri);
          } else {
            return !isComponentInPage(uri);
          }
        }), el => getName(el.getAttribute(refAttr), selected));
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
