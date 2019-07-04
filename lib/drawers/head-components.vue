<template>
  <filterable-list :content="list" :secondaryActions="secondaryActions" filterLabel="Search Components" header="Component" :addTitle="addTitle" @reorder="reorderComponents" @add="openAddComponent"></filterable-list>
</template>

<script>
  import _ from 'lodash';
  import { getComponentNode } from '../utils/head-components';
  import {
    getComponentName, refProp, componentListProp, removeProp
  } from '../utils/references';
  import { has } from '../core-data/groups';
  import label from '../utils/label';
  import filterableList from '../utils/filterable-list.vue';

  /**
   * Get the name of the component
   *
   * @param  {object} component
   * @return {object}
   */
  function formatComponents(component) {
    const uri = _.isString(component) ? component : component[refProp]; // page list will have strings, layout will have objects

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
          action: this.openSettings,
          // note: all head components _should_ have settings groups, because there's no other way to edit them
          // but we need to protect against poorly written schemas that don't
          enable: id => has(id, 'settings')
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
        if (_.get(this.schema, `${componentListProp}.page`)) {
          // list in the page
          return _.map(_.get(this.$store, `state.page.data['${this.path}']`), formatComponents);
        } else {
          // list in the layout
          return _.map(_.get(this.$store, `state.components['${this.uri}'].${this.path}`), formatComponents);
        }
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
        const componentNode = getComponentNode(id),
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
                this.$store.dispatch('removeHeadComponent', { el: componentNode, msg: input });
              }
            }
          });
        } else {
          this.$store.dispatch('removeHeadComponent', componentNode);
        }
      },
      reorderComponents(id, index, oldIndex) {
        let componentList;

        if (this.args.isPage) {
          componentList = _.reduce(_.get(this.$store, `state.page.data['${this.path}']`), (list, val) => list.concat(val), []);
          componentList.splice(oldIndex, 1); // remove at the old index
          componentList.splice(index, 0, id); // add at the new index
          this.$store.dispatch('savePage', { [this.path]: componentList });
        } else {
          componentList = _.reduce(_.get(this.$store, `state.components['${this.uri}'].${this.path}`), (list, val) => list.concat({ [refProp]: val[refProp] }), []);
          componentList.splice(oldIndex, 1); // remove at the old index
          componentList.splice(index, 0, { [refProp]: id }); // add at the new index
          this.$store.dispatch('saveComponent', { uri: this.uri, data: { [this.path]: componentList } });
        }
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
