<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';
  @import '../../styleguide/layers';
  @import '../../styleguide/buttons';

  // positioning - how much wider/taller should selectors be than components?
  $selector-offset: 16px;
  // amount of padding between component edges and selector border
  $half-selector-offset: $selector-offset / 2;
  $icon-size: 18px;
  $menu-size: 48px;
  $selector-fade-time: 150ms;
  $selector-fade-easing: linear;

  @keyframes initialFadeInOut {
    0% { opacity: 0; }
    15% { opacity: 1; }
    85% { opacity: 1; }
    100% { opacity: 0; }
  }

  // component element needs to be position: relative for the selectors to display
  .component-selector-wrapper {
    position: relative;
  }

  // fade things behind the component
  .component-selector:before {
    background: $selector-overlay;
    content: '';
    height: 100vh;
    left: 0;
    opacity: 0;
    pointer-events: none;
    position: fixed;
    transition: opacity $selector-fade-time $selector-fade-easing;
    top: 0;
    width: 100vw;
    z-index: -1;
  }

  // selector outlines
  .component-selector {
    background: inherit;
    height: 100%;
    left: 0;
    opacity: 0;
    // because we're just setting opacity to show/hide, don't allow child selectors to be clicked
    // note: .selected sets this to `all` so current selectors can be clicked
    pointer-events: none;
    position: absolute;
    top: 0;
    transition: opacity $selector-fade-time $selector-fade-easing;
    width: 100%;
    z-index: -1; // when unselected
    // so clicking into a component will set caret to proper position for inline forms
  }

  // menus
  .component-selector-top,
  .component-selector-bottom {
    @include component-toolbar-layer();

    background: $selector-bg;
    border: 1px solid $selector-border;
    height: $menu-size;
    width: 100%;
    right: 0;
    position: fixed;

    @media screen and (hover:hover) {
      min-width: 100%;
      opacity: 0;
      position: absolute;
      transition: opacity 200ms linear;
      width: auto;
    }
  }

  // firefox shim, see below for bug ticket
  .kiln-default-hover .component-selector-top,
  .kiln-default-hover .component-selector-bottom {
    min-width: 100%;
    opacity: 0;
    position: absolute;
    transition: opacity 200ms linear;
    width: auto;
  }

  // briefly display selectors when selecting the component
  .selected > .component-selector > .component-selector-top,
  .selected > .component-selector > .component-selector-bottom {
    animation-name: initialFadeInOut;
    animation-duration: 1.2s;
    animation-fill-mode: none;
  }

  // suppress initialFadeInOut animation if we're currently hovered over an element
  // when selecting it
  .kiln-suppress-animation.selected > .component-selector > .component-selector-top,
  .kiln-suppress-animation.selected > .component-selector > .component-selector-bottom {
    animation: none;
  }

  // to determine if an element is being hovered at the time it's selected,
  // we add an otherwise-unused css rule to that element on :hover
  // we have to do this because there's no way to determine mouse position other than
  // adding a WHOLE BUNCH of mouse events to the dom, which is gross and nonperformant
  .component-selector-wrapper:hover {
    @media screen and (hover:hover) {
      backface-visibility: hidden; // unused style to test if mouse is inside element
    }
  }

  // firefox shim, see below for bug ticket
  .kiln-default-hover .component-selector-wrapper:hover {
    backface-visibility: hidden; // unused style to test if mouse is inside element
  }

  // show selector menus on hover
  // todo: use pointer media query when firefox supports it https://bugzilla.mozilla.org/show_bug.cgi?id=1035774
  .component-selector-wrapper:hover > .component-selector > .component-selector-top,
  .component-selector-wrapper:hover > .component-selector > .component-selector-bottom {
    @media screen and (hover:hover) {
      opacity: 1;
    }
  }

  // firefox shim, see above for bug ticket
  .kiln-default-hover .component-selector-wrapper:hover > .component-selector > .component-selector-top,
  .kiln-default-hover .component-selector-wrapper:hover > .component-selector > .component-selector-bottom {
    opacity: 1;
  }

  .component-selector-top {
    top: 0;

    @media screen and (hover:hover) {
      bottom: calc(100% + #{$half-selector-offset});
      top: auto;
    }
  }

  // firefox shim, see above for bug ticket
  .kiln-default-hover .component-selector-top {
    bottom: calc(100% + #{$half-selector-offset});
    top: auto;
  }

  .component-selector-bottom {
    top: calc(100% - 96px); // account for toolbar

    @media screen and (hover:hover) {
      top: calc(100% + #{$half-selector-offset});
    }
  }

  // firefox shim, see above for bug ticket
  .kiln-default-hover .component-selector-bottom {
    top: calc(100% + #{$half-selector-offset});
  }

  // all menus use flex to align their buttons
  .component-selector-top,
  .component-selector-bottom,
  .selected-info,
  .selector-location,
  .selected-actions,
  .selector-navigation {
    align-items: center;
    display: flex;
    flex-flow: row;
    justify-content: flex-start;
  }

  // smaller menu areas need to flex
  .selected-info {
    flex: 1 0 auto;
  }

  .selector-location {
    flex: 0 0 auto;
    margin-left: 14px;
  }

  .selected-actions {
    flex: 0 0 auto;
  }

  .selector-navigation {
    flex: 1 0 auto;
  }

  // component location
  .selector-location svg {
    fill: $selector-icon;
    height: 11px;
    margin: 0;
    width: 11px;

    * {
      // fill for paths and groups inside the icons
      fill: $selector-icon;
    }
  }

  // multi-page / single-page toggle
  .selector-this-page {
    display: none;
  }

  .selector-many-pages {
    display: flex;
  }

  .kiln-page-area .selector-this-page {
    display: flex;
  }

  .kiln-page-area .selector-many-pages {
    display: none;
  }

  // component label
  .selected-label {
    @include label();

    color: $selector-text;
    flex: 1 0 auto;
    font-size: 14px;
    line-height: $icon-size; // same vertical space as the icons
    margin: 0;
    text-align: left;
    white-space: nowrap;
  }

  // bottom add/replace button should have border
  .selected-add,
  .selected-replace {
    border-left: 1px solid $selector-border;
  }

  // selected component
  .component-selector-wrapper.selected > .component-selector {
    // show selector
    opacity: 1;
    pointer-events: all;

    // fade other components
    &:before {
      opacity: 1;
    }
  }

  // z-index setting
  // needs to be:
  // 1. selected component (to appear above its siblings)
  // 2. components inside selected component (so you can click into them)
  .component-selector-wrapper.selected {
    z-index: 1 !important;
  }

  // selected component: components inside the selected component ALSO needs a higher z-index
  // so we can click into them when the parent is selected
  .component-selector-wrapper.selected [data-uri] {
    z-index: 2;
  }

  // all editable elements should have some kind of ux showing they can be edited
  .component-selector-wrapper *[data-editable] {
    cursor: pointer;
  }

  // editable TEXT elements should use a caret rather than a pointer through
  .component-selector-wrapper p[data-editable],
  .component-selector-wrapper blockquote[data-editable] {
    cursor: text;
  }

  // everything inside a regular placeholder should use the pointer,
  // even if that placeholder is inside a paragraph/blockquote
  .component-selector-wrapper .kiln-placeholder {
    cursor: pointer;
  }

  // inner component lists should always be flexed
  // (this will display properly if their parents are either flexed OR box)
  .component-list-inner {
    display: inherit;
    flex-direction: inherit;
    flex-wrap: inherit;
    flex: 1 1 100%;
  }

  // overlay div on top of iframes
  .iframe-overlay-div {
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }
</style>

<template>
  <aside data-ignore class="component-selector" @click.stop>
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
        <button class="selector-button selector-nav-up" title="Previous Visible Component" @click="prev"><icon name="up"></icon></button>
        <button class="selector-button selector-nav-down" title="Next Visible Component" @click="next"><icon name="down"></icon></button>
      </div>
      <button v-if="hasAddComponent" class="selector-button selected-add" title="Add Component" @click.stop="openAddComponentPane"><icon name="add-icon"></icon></button>
      <button v-if="hasReplaceComponent" class="selector-button selected-replace" title="Replace Component"><icon name="replace-icon"></icon></button>
    </aside>
  </aside>
</template>

<script>
  import _ from 'lodash';
  import store from '../core-data/store';
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

        return !_.isEmpty(getSettingsFields(getData(uri), getSchema(uri)).fields);
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
        const currentURI = this.$options.uri,
          parentURI = this.$options.parentURI,
          path = this.$options.parentField.path;

        return store.dispatch('openAddComponents', {
          currentURI,
          parentURI,
          path
        });
      },
      removeComponent() {
        store.dispatch('unselect');
        return store.dispatch('unfocus').then(() => store.dispatch('removeComponent', this.$el));
      },
      prev() {
        return store.dispatch('navigateComponents', 'prev');
      },
      next() {
        return store.dispatch('navigateComponents', 'next');
      }
    },
    components: {
      icon
    }
  };
</script>
