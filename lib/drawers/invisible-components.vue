<template>
  <filterable-list :content="list" :secondaryActions="secondaryActions" filterLabel="Search Components" header="Component" :addTitle="addTitle" @reorder="reorderComponents" @add="openAddComponent"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import {
    refProp, refAttr, removeProp, getComponentName
  } from '../utils/references';
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
      return {
        secondaryActions: [{
          icon: 'settings',
          tooltip: id => `${label(getComponentName(id))} Settings`,
          action: this.openSettings
          // note: all invisible components must have settings, because there's no other way to edit them
        }, {
          icon: 'delete',
          tooltip: id => `Remove ${label(getComponentName(id))}`,
          action: this.removeComponent
        }]
      };
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
        const componentEl = find(`[${refAttr}="${id}"]`),
          shouldConfirm = _.get(this.schema, removeProp),
          name = getComponentName(id);

        if (shouldConfirm) {
          this.$store.dispatch('openModal', {
            title: 'Remove Component',
            type: 'type-confirm',
            data: {
              text: `Are you sure you want to remove this <strong>${name}</strong>?`,
              name: name,
              onConfirm: (input) => {
                this.$store.dispatch('removeComponent', { el: componentEl, msg: input });
              }
            }
          });
        } else {
          this.$store.dispatch('removeComponent', componentEl);
        }
      },
      reorderComponents(id, index, oldIndex) {
        let componentList = _.reduce(_.get(this.$store, `state.components['${this.uri}'].${this.path}`), (list, val) => list.concat({ [refProp]: val[refProp] }), []);

        componentList.splice(oldIndex, 1); // remove at the old index
        componentList.splice(index, 0, { [refProp]: id }); // add at the new index
        this.$store.dispatch('saveComponent', { uri: this.uri, data: { [this.path]: componentList } });
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
