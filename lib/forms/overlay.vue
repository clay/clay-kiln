<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/forms';
  @import '../../styleguide/layers';
  @import '../../styleguide/cards';

  .kiln-overlay-form {
    @include form();
    @include overlay-layer();
    @include card();

    // height is computed when rendering, so we can animate it
    height: auto;
    max-height: 100vh;
    max-width: 100vw;
    opacity: 0;
    position: fixed;
    transform: translateX(-50%) translateY(-50%);
    width: 100px;

    .form-header {
      align-items: center;
      background-color: $card-header-bg-color;
      box-shadow: 0 1px 1px rgba(0, 0, 0, .16);
      display: flex;
      flex: 0 0 auto;
      height: 56px;
      justify-content: space-between;
      padding: 0 24px;
      width: 100%;
    }

    .form-header-title {
      @include type-title();

      margin: 0;
    }

    .form-contents {
      // fade this in after form opens
      align-self: flex-start;
      flex: 1 1 auto;
      // 100% minus form header height
      height: calc(100% - 76px);
      opacity: 0;
      width: 100%;

      .ui-tabs__body {
        // input container already has padding
        padding: 0;
      }
    }

    .input-container {
      overflow: scroll;
      padding: 16px 24px 24px;
      width: 100%;
    }

    .input-container-no-tabs {
      padding-top: 0;
    }
  }
</style>

<template>
  <transition name="overlay-fade-resize" appear mode="out-in" :css="false" @enter="enter" @leave="leave">
    <form class="kiln-overlay-form" v-if="hasCurrentOverlayForm" :key="formKey" :style="{ top: formTop, left: formLeft }" @click.stop @submit.prevent="save">
      <div class="form-header">
        <h2 class="form-header-title">{{ formHeader }}</h2>
        <ui-icon-button color="black" type="secondary" icon="check" ariaLabel="Save Form" tooltip="Save (ESC)" @click.stop="save"></ui-icon-button>
      </div>
      <div class="form-contents">
        <ui-tabs v-if="hasSections" fullwidth>
          <ui-tab v-for="(section, index) in sections" :title="section.title">
            <div class="input-container">
              <field v-for="(field, fieldIndex) in section.fields" :class="{ 'first-field': fieldIndex === 0 }" :name="field" :data="fields[field]" :schema="schema[field]"></field>
            </div>
          </ui-tab>
        </ui-tabs>
        <div v-else class="input-container input-container-no-tabs">
          <field v-for="(field, fieldIndex) in sections[0].fields" :class="{ 'first-field': fieldIndex === 0 }" :name="field" :data="fields[field]" :schema="schema[field]"></field>
        </div>
        <button type="submit" class="hidden-submit" @click.stop></button>
      </div>
    </form>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import { mapState } from 'vuex';
  import velocity from 'velocity-animate';
  import { getSchema } from '../core-data/components';
  import label from '../utils/label';
  import field from './field.vue';
  import UiIconButton from 'keen/UiIconButton';
  import UiTabs from 'keen/UiTabs';
  import UiTab from 'keen/UiTab';

  export default {
    data() {
      return {};
    },
    computed: mapState({
      hasCurrentOverlayForm: (state) => !_.isNull(state.ui.currentForm) && !state.ui.currentForm.inline,
      formKey: (state) => state.ui.currentForm.uri + state.ui.currentForm.path,
      formTop: (state) => {
        const path = state.ui.currentForm.path;

        if (path === 'settings') {
          return '50vh'; // open settings forms in the center of the viewport
        } else {
          const val = _.get(state, 'ui.currentForm.pos.y'),
            doc = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

          return val ? `${val / doc * 100}vh` : '50vh';
        }
      },
      formLeft: (state) => {
        const path = state.ui.currentForm.path,
          val = _.get(state, 'ui.currentForm.pos.x');

        if (path === 'settings') {
          return '50vw'; // open settings forms in the center of the viewport
        } else if (val) {
          const doc = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
            isInsideViewport = val > 320 && val < doc - 320; // 20px of space on either side, otherwise we center the form

          return isInsideViewport ? `${val / doc * 100}vw` : '50vw';
        } else {
          return '50vw';
        }
      },
      formHeader: (state) => label(state.ui.currentForm.path, state.ui.currentForm.schema),
      hasSections: (state) => state.ui.currentForm.schema.sections && state.ui.currentForm.schema.sections.length > 1,
      sections: (state) => {
        const sections = _.get(state, 'ui.currentForm.schema.sections');

        if (!_.isEmpty(sections)) {
          return _.map(sections, (section) => {
            return {
              title: section.title,
              fields: section.fields
            };
          });
        } else {
          // no sections, so return a single "section" with all the fields
          return [{
            fields: state.ui.currentForm.schema.fields || [state.ui.currentForm.path], // group or single field
          }];
        }
      },
      fields: (state) => state.ui.currentForm.fields,
      schema: (state) => getSchema(state.ui.currentForm.uri)
    }),
    methods: {
      enter(el, done) {
        this.$nextTick(() => {
          // wait for children before calculating height
          const innerEl = find(el, '.form-contents'),
            openHeight = el.offsetHeight;

          el.style.height = '100px'; // animate from 100px to auto height
          velocity(el, { opacity: 1 }, { duration: 100 });
          velocity(el, { width: 600 }, { duration: 280 });
          velocity(innerEl, { opacity: 1 }, { delay: 325, duration: 50 });
          velocity(el, { height: openHeight }, { delay: 35, duration: 340, complete: () => {
            // after animating, set top directly (and stop the transform)
            // so tab switching won't move the form
            el.style.top = `${el.getBoundingClientRect().top}px`;
            el.style.transform = 'translateX(-50%)';
            done();
          } });
        });
      },
      leave(el, done) {
        const innerEl = find(el, '.form-contents');

        velocity(el, { width: 100 }, { delay: 55, duration: 320 });
        velocity(el, { height: 100 }, { duration: 320 });
        velocity(innerEl, { opacity: 0 }, { duration: 50 });
        velocity(el, { opacity: 0 }, { delay: 220, duration: 100, complete: done });
      },
      save() {
        this.$store.dispatch('unfocus');
      }
    },
    components: {
      field,
      UiIconButton,
      UiTabs,
      UiTab
    }
  };
</script>
