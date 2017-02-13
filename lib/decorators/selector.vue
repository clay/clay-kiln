<template>
  <aside class="component-selector">
    <aside class="component-selector-top">
      <div class="selected-info">
        <span class="selector-location">
          <icon v-if="isPageRoot" name="this-page" class="selector-this-page" title="This Page"></icon>
          <icon v-else name="many-pages" class="selector-many-pages" title="Multiple Pages"></icon>
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
  import { mapState } from 'vuex';
  import store from '../core-data/store';
  import label from '../utils/label';
  import { getComponentName } from '../utils/references';
  import icon from '../utils/icon.vue';

  export default {
    store,
    data() {
      return {};
    },
    computed: mapState({
      // todo: how do we instantiate these with a slice of the state?
      // e.g. pass in tree props, so we know where in the tree we are,
      // and can pop() the last prop to grab the component data from the components substore
      // (and grab the name to grab the schema)
      componentLabel() {
        return label(getComponentName(this.$options.uri));
      },
      isPageRoot: () => false,
      hasSettings: () => false,
      hasDelete: () => false,
      hasAddComponent: () => false,
      hasReplaceComponent: () => false
    }),
    components: {
      icon
    }
  };
</script>
