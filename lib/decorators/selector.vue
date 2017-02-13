<template>
  <aside class="component-selector">
    <aside class="component-selector-top">
      <div class="selected-info">
        <span class="selector-location">
          <icon name="this-page" class="selector-this-page" title="This Page"></icon>
          <icon name="many-pages" class="selector-many-pages" title="Multiple Pages"></icon>
        </span>
        <span class="selector-button selected-label">{{ componentLabel }}</span>
      </div>
      <div class="selected-actions">
        <button v-if="hasSettings" class="selector-button selected-action-settings" title="Component Settings"><icon name="settings"></icon></button>
        <button v-if="hasDelete" class="selector-button selected-action-delete" title="Delete Component"><icon name="delete"></icon></button>
      </div>
    </aside>
    <aside class="component-selector-bottom">
      <div class="selector-navigation">
        <button class="selector-button selector-nav-up" title="Previous Visible Component"><icon name="up"></icon></button>
        <button class="selector-button selector-nav-down" title="Next Visible Component"><icon name="down"></icon></button>
      </div>
      <button v-if="hasAddComponent" class="selector-button selected-add" title="Add Component"><icon name="add-icon"></icon></button>
      <button v-if="hasReplaceComponent" class="selector-button selected-replace" title="Replace Component"><icon name="replace-icon"></icon></button>
    </aside>
  </aside>
</template>

<script>
  import { isEmpty } from 'lodash';
  import { getData, getSchema } from '../core-data/components';
  import label from '../utils/label';
  import { getComponentName } from '../utils/references';
  import { getSettingsFields } from '../core-data/groups';
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
      // note: only for components in LISTS! components in properties can be replaced but not deleted (for now)
      hasDelete() {
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
    components: {
      icon
    }
  };
</script>
