<style lang="sass">
  @import '../../styleguide/forms';
  @import '../../styleguide/layers';
  @import '../../styleguide/cards';

  .kiln-overlay-form {
    @include form();
    @include overlay-layer();
    @include card();

    align-items: flex-start;
    // height is computed when rendering, so we can animate it
    height: auto;
    left: 50vw;
    max-height: 100vh;
    max-width: 100vw;
    opacity: 0;
    position: fixed;
    top: 50vh;
    transform: translateX(-50%) translateY(-50%);
    width: 100px;

    .form-header {
      align-items: center;
      display: flex;
      flex: 0 0 auto;
      justify-content: space-between;
      padding: 24px 16px 16px;
      width: 100%;
    }

    .form-header-title {
      @include type-title();

      margin: 0;
    }

    .form-contents {
      // fade this in after form opens
      opacity: 0;
      width: 100%;
    }

    .input-container {
      overflow: scroll;
      padding: 16px 16px 24px;
      width: 100%;
    }
  }
</style>

<template>
  <transition name="overlay-fade-resize" appear mode="out-in" :css="false" @enter="enter" @leave="leave">
    <form class="kiln-overlay-form" v-if="hasCurrentOverlayForm" :key="formKey" :style="{ top: formTop, left: formLeft }" @click.stop @submit.prevent="save">
      <div class="form-header">
        <h2 class="form-header-title">{{ formHeader }}</h2>
        <ui-icon-button type="secondary" icon="check" ariaLabel="Save Form" tooltip="Save (ESC)" @click.stop="save"></ui-icon-button>
      </div>
      <div class="form-contents">
        <ui-tabs v-if="hasSections">
          <ui-tab v-for="(section, index) in sections" :title="section.title">
            <div class="input-container">
              <field v-for="(field, fieldIndex) in section.fields" :class="{ 'first-field': fieldIndex === 0 }" :name="field" :data="fields[field]" :schema="schema[field]"></field>
            </div>
          </ui-tab>
        </ui-tabs>
        <div v-else class="input-container">
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
      return {
        formTop: '50vh',
        formLeft: '50vw'
      };
    },
    computed: mapState({
      hasCurrentOverlayForm: (state) => !_.isNull(state.ui.currentForm) && !state.ui.currentForm.inline,
      formKey: (state) => state.ui.currentForm.uri + state.ui.currentForm.path,
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
        const innerEl = find(el, '.form-contents'),
          openHeight = el.offsetHeight;

        el.style.height = '100px'; // animate from 100px to auto height
        velocity(el, { opacity: 1 }, { duration: 100 });
        velocity(el, { width: 600 }, { duration: 280 });
        velocity(innerEl, { opacity: 1 }, { delay: 325, duration: 50 });
        velocity(el, { height: openHeight }, { delay: 35, duration: 340, complete: done });
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
