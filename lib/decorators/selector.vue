<template>
  <aside class="component-selector" @click.stop>
    <!-- stop clicks on the selector from bubbling up -->
    <aside class="component-selector-top">
      <div class="selected-info">
        <span class="selector-location">
          <icon name="this-page" class="selector-this-page" title="This Page"></icon>
          <icon name="many-pages" class="selector-many-pages" title="Multiple Pages"></icon>
        </span>
        <span class="selector-button selected-label">{{ componentLabel }}</span>
      </div>
      <div class="selected-actions">
        <button v-if="hasSettings" class="selector-button selected-action-settings" title="Component Settings" @click="openSettings"><icon name="settings"></icon></button>
        <button v-if="hasRemove" class="selector-button selected-action-delete" title="Remove Component" @click="removeComponent"><icon name="delete"></icon></button>
      </div>
    </aside>
    <aside class="component-selector-bottom">
      <div class="selector-navigation">
        <button class="selector-button selector-nav-up" title="Previous Visible Component"><icon name="up"></icon></button>
        <button class="selector-button selector-nav-down" title="Next Visible Component"><icon name="down"></icon></button>
      </div>
      <button v-if="hasAddComponent" class="selector-button selected-add" title="Add Component" @click.stop="openAddComponentPane"><icon name="add-icon"></icon></button>
      <button v-if="hasReplaceComponent" class="selector-button selected-replace" title="Replace Component"><icon name="replace-icon"></icon></button>
    </aside>
  </aside>
</template>

<script>
  import { map } from 'lodash';
  import { isEmpty } from 'lodash';
  import store from '../core-data/store';
  import { getData, getSchema } from '../core-data/components';
  import label from '../utils/label';
  import { getComponentName } from '../utils/references';
  import { getParentComponent } from '../utils/component-elements';
  import { getSettingsFields } from '../core-data/groups';
  import { addComponentPane } from '../utils/panes';
  import icon from '../utils/icon.vue';

  export default {
    data() {
      return {};
    },
    computed: {
      componentLabel() {
        return label(getComponentName(this.$options.uri));
      },
      hasSettings() {
        const uri = this.$options.uri;

        return !isEmpty(getSettingsFields(getData(uri), getSchema(uri)));
      },
      // note: only for components in LISTS! components in properties can be replaced but not removed (for now)
      hasRemove() {
        const parentField = this.$options.parentField;

        return parentField && parentField.type === 'list';
      },
      hasAddComponent() {
        const parentField = this.$options.parentField;

        return parentField && parentField.type === 'list';
      },
      hasReplaceComponent() {
        const parentField = this.$options.parentField;

        return parentField && parentField.type === 'prop';
      }
    },
    methods: {
      openSettings() {
        const uri = this.$options.uri,
          path = 'settings';

        store.dispatch('focus', { uri, path });
      },
      openAddComponentPane() {
        var component = document.querySelector(`[data-uri="${this.$options.uri}"]`), // Find the component
          parentUri = getParentComponent(component).getAttribute('data-uri'), // Find the parent component
          componentListName = component.parentNode.getAttribute('data-editable'), // Find the component list of the parent
          parentName = getComponentName(parentUri), // Get the name of the parent component from the URI
          componentList = _.get(store, `state.schemas[${parentName}][${componentListName}]._componentList`, ''); // Grab the included components from the parent's schema

        // Open the pane and send it the component list
        addComponentPane(componentList.include);
      },
      removeComponent() {
        return store.dispatch('removeComponent', this.$el);
      }
    },
    components: {
      icon
    }
  };
</script>
