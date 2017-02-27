<style lang="sass">
  @import '../../styleguide/typography';
  @import '../../styleguide/buttons';
  $pane-margin: 30vh;
  $easeOutExpo: cubic-bezier(.190, 1.000, .220, 1.000);
  $toolbar-height: 48px;

  .kiln-toolbar-pane {
    @include primary-text();

    background-color: $white;
    bottom: 0;
    box-shadow: 0 0 30px 0 $overlay-shadow;
    cursor: auto;
    display: flex;
    flex-direction: column;
    height: auto;
    justify-content: flex-start;
    margin: 0;
    max-height: 100 - $pane-margin;
    max-width: 320px;
    min-height: 400px;
    min-width: 200px;
    padding: 0;
    position: absolute;
    transition: transform 350ms $easeOutExpo;
    width: 100%;

    @media screen and (min-width: 600px) {
      width: 90%;

      &.kiln-toolbar-pane-large {
        max-width: 500px;
      }

      &.kiln-toolbar-pane-form {
        max-width: 600px;
        left: 50%;
        margin-left: -300px;
      }
    }

    @media screen and (min-width: 1024px) {
      width: 80%;
    }
  }

  .pane-slide-enter, .pane-slide-leave-active {
    transform: translate3d(0, 100%, 0);
  }
</style>

<template>
  <transition name="pane-slide">
    <div class="kiln-toolbar-pane"
      v-if="hasPaneOpenState"
      v-bind:class="{ 'kiln-toolbar-pane-large': largePane, 'kiln-toolbar-pane-form': componentSchema }"
      v-bind:style="{ left: `${paneOffset}px` }" @click.stop>
      <pane-header :paneTitle="paneTitle" :buttonClick="closePane" :check="headerIcon"></pane-header>
      <component :is="nonTabComponent" :content="nonTabContent" v-if="nonTabComponent"></component>
      <pane-tabs :tabs="tabs" :contents="tabContents" v-if="tabs.length"></pane-tabs>
      <edit-form v-if="componentSchema" :fields="fields" :componentSchema="componentSchema" :fieldNames="fieldNames"></edit-form>
    </div>
  </transition>
</template>


<script>
  import _ from 'lodash';
  import { OPEN_PANE, CLOSE_PANE } from '../panes/mutationTypes'
  import { mapState } from 'vuex';
  import { displayProp, getComponentName } from '../utils/references';
  import label from '../utils/label';
  import paneTabs from './pane-tabs.vue';
  import icon from '../utils/icon.vue';
  import editForm from './edit-form.vue';
  import paneHeader from './pane-header.vue';

  const STATE_PATHS = {
    CONTENT: 'ui.currentPane.options.content',
  };

  /**
   * Returns a new array with only the desired
   * property as for each entry
   *
   * @param  {Array} content
   * @param  {String} property
   * @return {Array}
   */
  function separateContent(content, property) {
    return _.compact(_.map(content, item => _.get(item, property, null)));
  }

  export default {
    props: [],
    data() {
      return {};
    },
    computed: mapState({
      hasPaneOpenState: (state) => (!_.isNull(state.ui.currentForm) && state.ui.currentForm.schema[displayProp] !== 'inline') || !_.isNull(_.get(state, 'ui.currentPane.name', null)),
      fields: (state) => _.get(state, 'ui.currentForm.fields', null),
      fieldNames: (state) => {
        return _.get(state, 'ui.currentForm.schema.fields', [_.get(state, 'ui.currentForm.path')]); // group or single field
      },
      schema: (state) => _.get(state, 'ui.currentForm.schema', null),
      componentSchema: (state) => {
        var currentFormUri = _.get(state, 'ui.currentForm.uri', null);

        return currentFormUri ? _.get(state, `schemas[${getComponentName(currentFormUri)}]`, null) : null;
      },
      paneTitle: (state) => {
        var title = _.get(state, 'ui.currentPane.options.title', null),
          currentFormPath = _.get(state, 'ui.currentForm.path', null),
          currentFormSchema = _.get(state, 'ui.currentForm.schema', null);

        return currentFormPath && currentFormSchema ? label(currentFormPath, currentFormSchema) : title;
      },
      nonTabComponent: (state) => _.get(state, 'ui.currentPane.options.component', ''),
      nonTabContent: (state) => _.get(state, 'ui.currentPane.options.content', ''),
      tabs: (state) => separateContent(_.get(state, STATE_PATHS.CONTENT, null), 'title'),
      tabContents: (state) => separateContent(_.get(state, STATE_PATHS.CONTENT, null), 'tabContent'),
      largePane: (state) => Boolean(_.get(state, 'ui.currentPane.options.large', false)),
      paneOffset: (state) => {
        // TODO: Make this work with variable pane widths
        var offset = _.get(state, 'ui.currentPane.paneOffset', ''),
          paneWidth = 320,
          rightAlignedOffset = null;

        if (offset && (offset.left + paneWidth > window.innerWidth)) {
          rightAlignedOffset = (offset.left + offset.width) - paneWidth;
        }

        return rightAlignedOffset || offset.left;
      },
      headerIcon() {
        return this.componentSchema ? 'publish-check' : 'close-edit';
      }
    }),
    methods: {
      closePane() {
        var currentPane = _.get(this.$store, 'state.ui.currentPane');

        this.$store.dispatch('closePane');
      }
    },
    components: _.assign(window.kiln.panes, { 'pane-tabs': paneTabs, icon, 'edit-form': editForm, 'pane-header': paneHeader })
  };
</script>
