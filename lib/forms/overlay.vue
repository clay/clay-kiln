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
    display: block;
    height: auto;
    max-height: 100vh;
    max-width: 100vw;
    opacity: 0;
    position: fixed;
    transform: translateX(-50%) translateY(-50%);
    width: 600px;

    .form-header {
      align-items: center;
      background-color: $card-header-bg-color;
      border-top-left-radius: 2px;
      border-top-right-radius: 2px;
      box-shadow: 0 1px 1px rgba(0, 0, 0, .16);
      display: flex;
      height: 56px;
      justify-content: space-between;
      opacity: 0;
      padding: 0 24px;
      position: relative;
      width: 100%;
    }

    .form-header-title {
      @include type-title();

      margin: 0;
    }

    .form-contents {
      // fade this in after form opens
      display: block;
      height: auto;
      opacity: 0;
      position: relative;
      width: 100%;

      .ui-tabs {
        // input container already has padding
        margin: 0;
      }

      .ui-tabs__body {
        border: none;
        // input container already has padding
        padding: 0;
      }
    }

    .input-container {
      overflow: scroll;
      padding: 16px 24px 24px;
      width: 100%;
    }

    .required-footer {
      @include type-caption();
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
        <ui-tabs v-if="hasSections" fullwidth ref="tabs">
          <ui-tab v-for="(section, index) in sections" :title="section.title">
            <div class="input-container">
              <field v-for="(field, fieldIndex) in section.fields" :class="{ 'first-field': fieldIndex === 0 }" :name="field" :data="fields[field]" :schema="schema[field]"></field>
              <div v-if="hasRequiredFields" class="required-footer">* Required fields</div>
            </div>
          </ui-tab>
        </ui-tabs>
        <div v-else class="input-container">
          <field v-for="(field, fieldIndex) in sections[0].fields" :class="{ 'first-field': fieldIndex === 0 }" :name="field" :data="fields[field]" :schema="schema[field]"></field>
          <div v-if="hasRequiredFields" class="required-footer">* Required fields</div>
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
  import { fieldProp } from '../utils/references';
  import field from './field.vue';
  import UiIconButton from 'keen/UiIconButton';
  import UiTabs from 'keen/UiTabs';
  import UiTab from 'keen/UiTab';

  export default {
    data() {
      return {
        formTop: '50vh'
      };
    },
    computed: mapState({
      hasCurrentOverlayForm: (state) => !_.isNull(state.ui.currentForm) && !state.ui.currentForm.inline,
      formKey: (state) => state.ui.currentForm.uri + state.ui.currentForm.path,
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
      formHeader: (state) => state.ui.currentForm.path && label(state.ui.currentForm.path, state.ui.currentForm.schema),
      hasSections: (state) => state.ui.currentForm.schema.sections && state.ui.currentForm.schema.sections.length > 1,
      sections: (state) => {
        const sections = state.ui.currentForm.schema.sections;

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
      schema: (state) => getSchema(state.ui.currentForm.uri),
      hasRequiredFields() {
        // true if any of the fields in the current form have required validation
        return _.some(this.schema, (val, key) => _.includes(Object.keys(this.fields), key) && _.has(val, `${fieldProp}.validate.required`));
      }
    }),
    methods: {
      enter(el, done) {
        const path = _.get(this.$store, 'state.ui.currentForm.path'),
          posY = _.get(this.$store, 'state.ui.currentForm.pos.y'),
          docHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        this.$nextTick(() => {
          const headerEl = find(el, '.form-header'),
            innerEl = find(el, '.form-contents'),
            finalHeight = el.clientHeight;

          if (path === 'settings' || !posY) {
            // set top position of form once we know how tall it should be,
            // to prevent overflowing the top/bottom of the viewport
            this.formTop = '50vh';
          } else {
            const heightPlusMargin = finalHeight / 2 + 20,
              isInsideViewport = posY > heightPlusMargin && posY < docHeight - heightPlusMargin;

            this.formTop = isInsideViewport ? `${posY / docHeight * 100}vh` : '50vh';
          }
          el.style.height = '100px'; // animate from 100px to auto height (auto)
          el.style.width = '100px'; // animate from 100px to auto width (600px)
          velocity(el, { opacity: 1 }, { duration: 100 });
          velocity(el, { width: 600 }, { duration: 280 });
          velocity(headerEl, { opacity: 1 }, { delay: 325, duration: 50 });
          velocity(innerEl, { opacity: 1 }, { delay: 325, duration: 50 });
          velocity(el, { height: finalHeight }, { delay: 35, duration: 340, complete: () => {
            if (this.$refs.tabs) {
              // manually reset the initial width of the indicator, see https://github.com/JosephusPaye/Keen-UI/issues/328
              this.$refs.tabs.refreshIndicator();
            }
            done();
          } });
        });
      },
      leave(el, done) {
        const headerEl = find(el, '.form-header'),
          innerEl = find(el, '.form-contents');

        velocity(el, { width: 100 }, { delay: 55, duration: 320 });
        velocity(el, { height: 100 }, { duration: 320 });
        velocity(headerEl, { opacity: 0 }, { duration: 50 });
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
