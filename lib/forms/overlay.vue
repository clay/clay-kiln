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
    max-height: calc(100vh - 100px);
    max-width: 100vw;
    opacity: 0;
    position: fixed;
    transform: translateX(-50%);
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
      // visually align the right buttons
      padding: 0 14px 0 24px;
      position: relative;
      width: 100%;
    }

    .form-header-title {
      @include type-title();

      margin: 0;
    }

    .form-header-actions {
      align-items: center;
      display: flex;
      justify-content: flex-end;
    }

    .form-close-divider {
      border-left: 1px solid $divider-color;
      height: 22px;
      margin-left: 10px;
      width: 10px;
    }

    .form-contents {
      // fade this in after form opens
      display: block;
      height: calc(100% - 56px);
      opacity: 0;
      position: relative;
      width: 100%;

      .ui-tabs {
        // input container already has padding
        height: 100%;
        margin: 0;
      }

      .ui-tabs__body {
        border: none;
        height: 100%;
        // input container already has padding
        padding: 0;
      }
    }

    .input-container-wrapper {
      height: 100%;
      margin: 0;
      overflow: scroll;
      padding: 0;
      width: 100%;
    }

    .input-container {
      height: auto;
      min-height: 100%;
      padding: 16px 24px 24px;
      position: relative;
      width: 100%;
    }

    .required-footer {
      @include type-caption();

      margin-top: 10px;
      width: 100%;
    }
  }
</style>

<template>
  <transition name="overlay-fade-resize" appear mode="out-in" :css="false" @enter="enter" @leave="leave">
    <form class="kiln-overlay-form" v-if="hasCurrentOverlayForm" :key="formKey" :style="{ top: formTop, left: formLeft }" @click.stop @submit.stop.prevent="save">
      <div class="form-header">
        <h2 class="form-header-title">{{ formHeader }}</h2>
        <div class="form-header-actions">
          <ui-icon-button v-if="componentLabel" type="secondary" color="black" icon="info_outline" :tooltip="`${componentLabel} Info`" @click.stop="openInfo"></ui-icon-button>
          <ui-icon-button v-if="hasSettings" type="secondary" color="black" icon="settings" :tooltip="`${componentLabel} Settings`" @click.stop="openSettings"></ui-icon-button>
          <component v-for="(button, index) in customButtons" :is="button" :key="index"></component>
          <ui-icon-button v-if="hasRemove" type="secondary" color="black" icon="delete" :tooltip="`Remove ${componentLabel}`" @click.stop="removeComponent"></ui-icon-button>
          <ui-icon-button v-if="hasDuplicateComponent" type="secondary" color="black" icon="add_circle_outline" :tooltip="`Add ${componentLabel}`" @click.stop="duplicateComponent"></ui-icon-button>
          <ui-icon-button v-if="hasDuplicateComponentWithData" type="secondary" color="black" icon="add_circle" :tooltip="`Duplicate ${componentLabel}`" @click.stop="duplicateComponentWithData"></ui-icon-button>
          <ui-icon-button v-if="hasAddComponent" type="secondary" color="black" icon="add" :tooltip="addComponentText" @click.stop="openAddComponentPane"></ui-icon-button>
          <div class="form-close-divider"></div>
          <ui-icon-button color="black" type="secondary" icon="check" ariaLabel="Save Form" tooltip="Save (ESC)" @click.stop="save"></ui-icon-button>
        </div>
      </div>
      <div class="form-contents">
        <ui-tabs v-if="hasSections" fullwidth ref="tabs">
          <ui-tab v-for="(section, index) in sections" :key="index" :title="section.title">
            <div class="input-container-wrapper" :style="{ 'max-height': `calc(100vh - ${formTop} - 104px)`}">
              <div class="input-container">
                <field v-for="(field, fieldIndex) in section.fields" :key="fieldIndex" :class="{ 'first-field': fieldIndex === 0 }" :name="field" :data="fields[field]" :schema="schema[field]" @resize="onResize"></field>
                <div v-if="section.hasRequiredFields" class="required-footer">* Required fields</div>
              </div>
            </div>
          </ui-tab>
        </ui-tabs>
        <div v-else class="input-container-wrapper" :style="{ 'max-height': `calc(100vh - ${formTop} - 56px)`}">
          <div class="input-container">
            <field v-for="(field, fieldIndex) in sections[0].fields" :key="fieldIndex" :class="{ 'first-field': fieldIndex === 0 }" :name="field" :data="fields[field]" :schema="schema[field]" @resize="onResize"></field>
            <div v-if="hasRequiredFields" class="required-footer">* Required fields</div>
          </div>
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
  import velocity from 'velocity-animate/velocity.min.js';
  import { getSchema } from '../core-data/components';
  import label from '../utils/label';
  import logger from '../utils/log';
  import { fieldProp, groupsProp, getComponentName, componentListProp } from '../utils/references';
  import { getComponentEl } from '../utils/component-elements';
  import field from './field.vue';
  import UiIconButton from 'keen/UiIconButton';
  import UiTabs from 'keen/UiTabs';
  import UiTab from 'keen/UiTab';

  const log = logger(__filename);

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
      formHeader: (state) => {
        if (_.size(state.ui.currentForm.fields) === 1) {
          // one field, use the component name as the form header
          return label(getComponentName(state.ui.currentForm.uri));
        } else {
          return label(state.ui.currentForm.path, state.ui.currentForm.schema);
        }
      },
      hasSections: (state) => state.ui.currentForm.schema.sections && state.ui.currentForm.schema.sections.length > 1,
      sections() {
        const currentForm = _.get(this.$store, 'state.ui.currentForm'),
          sections = _.get(currentForm, 'schema.sections'),
          fields = _.get(currentForm, 'schema.fields'),
          path = _.get(currentForm, 'path'),
          schema = this.schema;

        if (!_.isEmpty(sections)) {
          return _.map(sections, (section) => {
            return {
              title: section.title,
              fields: section.fields,
              hasRequiredFields: _.some(schema, (val, key) => _.includes(Object.keys(section.fields), key) && _.has(val, `${fieldProp}.validate.required`))
            };
          });
        } else {
          // no sections, so return a single "section" with all the fields
          return [{
            fields: fields || [path], // group or single field
          }];
        }
      },
      fields: (state) => state.ui.currentForm.fields,
      schema: (state) => getSchema(state.ui.currentForm.uri),
      hasRequiredFields() {
        // true if any of the fields in the current form have required validation
        return _.some(this.schema, (val, key) => _.includes(Object.keys(this.fields), key) && _.has(val, `${fieldProp}.validate.required`));
      },
      componentLabel: (state) => label(getComponentName(state.ui.currentForm.uri)),
      hasSettings(state) {
        return state.ui.currentForm.path !== 'settings' && _.has(this.schema, `${groupsProp}.settings`);
      },
      customButtons() {
        return Object.keys(_.get(window, 'kiln.selectorButtons', {}));
      },
      isCurrentlySelected: (state) => _.get(state, 'ui.currentForm.uri') === _.get(state, 'ui.currentSelection.uri'),
      hasRemove(state) {
        return this.isCurrentlySelected && _.get(state, 'ui.currentSelection.parentField.isEditable');
      },
      hasDuplicateComponent(state) {
        return this.isCurrentlySelected && _.get(state, 'ui.currentSelection.parentField.type') === 'list' && _.get(state, 'ui.currentSelection.parentField.isEditable') && !_.get(state, 'ui.metaKey');
      },
      hasDuplicateComponentWithData(state) {
        return this.isCurrentlySelected && _.get(state, 'ui.currentSelection.parentField.type') === 'list' && _.get(state, 'ui.currentSelection.parentField.isEditable') && _.get(state, 'ui.metaKey');
      },
      hasAddComponent(state) {
        return this.isCurrentlySelected && _.get(state, 'ui.currentSelection.parentField.type') === 'list' && _.get(state, 'ui.currentSelection.parentField.isEditable');
      },
      addComponentText(state) {
        if (this.hasAddComponent) {
          const schema = getSchema(_.get(state, 'ui.currentSelection.parentURI'), _.get(state, 'ui.currentSelection.parentField.path')),
            componentsToAdd = _.get(schema, `${componentListProp}.include`),
            hasOneComponent = componentsToAdd && componentsToAdd.length === 1;

          return hasOneComponent ? `Add ${label(componentsToAdd[0])}` : 'Add Components';
        }
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
            finalHeight = el.clientHeight,
            halfFinalHeight = finalHeight / 2;

          if (path === 'settings' || !posY) {
            // set top position of form once we know how tall it should be,
            // to prevent overflowing the top/bottom of the viewport
            this.formTop = `${docHeight / 2 - halfFinalHeight}px`;
          } else {
            const heightPlusMargin = finalHeight / 2 + 20,
              isInsideViewport = posY > heightPlusMargin && posY < docHeight - heightPlusMargin - 500;
              // give the bottom calculation about 500px more room, so complex-list items
              // don't overflow the bottom of the viewport (if they're opened when they don't have any items yet)

            this.formTop = isInsideViewport ? `${posY - halfFinalHeight}px` : `${docHeight / 2 - halfFinalHeight}px`;
          }
          el.style.height = '100px'; // animate from 100px to auto height (auto)
          el.style.width = '100px'; // animate from 100px to auto width (600px)
          velocity(el, { opacity: 1 }, { duration: 100 });
          velocity(el, { width: 600 }, { duration: 180 });
          velocity(headerEl, { opacity: 1 }, { delay: 225, duration: 50 });
          velocity(innerEl, { opacity: 1 }, { delay: 225, duration: 50 });
          velocity(el, { height: finalHeight }, { delay: 35, duration: 240, complete: () => {
            // set the height to auto, so forms can grow if the fields inside them grow
            // (e.g. adding complex-list items)
            // el.style.height = 'auto';
            el.style.maxHeight = `calc(100vh - ${this.formTop})`;
            el.style.height = 'auto';

            // manually reset the initial width of the indicator, see https://github.com/JosephusPaye/Keen-UI/issues/328
            if (this.$refs.tabs) {
              this.$refs.tabs.refreshIndicator();
            }
            done();
          } });
        });
      },
      leave(el, done) {
        const headerEl = find(el, '.form-header'),
          innerEl = find(el, '.form-contents');

        velocity(el, { width: 100 }, { delay: 55, duration: 220 });
        velocity(el, { height: 100 }, { duration: 220 });
        velocity(headerEl, { opacity: 0 }, { duration: 50 });
        velocity(innerEl, { opacity: 0 }, { duration: 50 });
        velocity(el, { opacity: 0 }, { delay: 120, duration: 100, complete: done });
      },
      onResize(additionalPixels) {
        additionalPixels = additionalPixels || 0;

        this.$nextTick(() => {
          const innerEl = find(this.$el, '.input-container'),
            // note: we can't grab the scrollHeight of the innerEl, since it's always 100% height,
            // but we can calculate the height of all the child fields
            innerHeight = innerEl.clientHeight,
            currentTop = parseInt(this.formTop),
            docHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
            newHeight = innerHeight + 56 + additionalPixels, // header is 56px
            isInsideViewport = currentTop + newHeight < docHeight;

          if (isInsideViewport) {
            velocity(this.$el, { height: newHeight }, { duration: 220 });
          } else {
            velocity(this.$el, { height: docHeight - currentTop }, { duration: 220 });
          }
        });
      },
      openInfo() {
        const description = _.get(this.schema, '_description');

        if (!description) {
          log.error(`Cannot open component information: "${this.componentLabel}" has no description!`, { action: 'openInfo' });
        } else {
          return this.$store.dispatch('openModal', {
            title: this.componentLabel,
            type: 'info',
            data: description
          });
        }
      },
      openSettings() {
        return this.$store.dispatch('focus', { uri: _.get(this.$store, 'state.ui.currentForm.uri'), path: 'settings' });
      },
      removeComponent() {
        const currentURI = _.get(this.$store, 'state.ui.currentSelection.uri'),
          el = currentURI && getComponentEl(currentURI);

        this.$store.dispatch('unselect');
        return this.$store.dispatch('unfocus').then(() => this.$store.dispatch('removeComponent', el));
      },
      openAddComponentPane() {
        return this.$store.dispatch('openAddComponent', {
          currentURI: _.get(this.$store, 'state.ui.currentForm.uri'),
          parentURI: _.get(this.$store, 'state.ui.currentSelection.parentURI'),
          path: _.get(this.$store, 'state.ui.currentSelection.parentField.path')
        });
      },
      duplicateComponent() {
        const uri = _.get(this.$store, 'state.ui.currentForm.uri'),
          name = getComponentName(uri);

        this.$store.commit('DUPLICATE_COMPONENT', name);
        return this.$store.dispatch('addComponents', {
          currentURI: uri,
          parentURI: _.get(this.$store, 'state.ui.currentSelection.parentURI'),
          path: _.get(this.$store, 'state.ui.currentSelection.parentField.path'),
          components: [{ name }]
        }).then((newEl) => this.$store.dispatch('select', newEl));
      },
      duplicateComponentWithData() {
        const uri = _.get(this.$store, 'state.ui.currentForm.uri'),
          name = getComponentName(uri),
          data = _.get(this.$store, `state.components["${uri}"]`);

        this.$store.commit('DUPLICATE_COMPONENT_WITH_DATA', name);
        return this.$store.dispatch('addComponents', {
          currentURI: uri,
          parentURI: _.get(this.$store, 'state.ui.currentSelection.parentURI'),
          path: _.get(this.$store, 'state.ui.currentSelection.parentField.path'),
          components: [{ name, data }],
          clone: true
        }).then((newEl) => this.$store.dispatch('select', newEl));
      },
      save() {
        this.$store.dispatch('unfocus');
      }
    },
    components: _.merge({}, _.get(window, 'kiln.selectorButtons', {}), {
      field,
      UiIconButton,
      UiTabs,
      UiTab
    })
  };
</script>
