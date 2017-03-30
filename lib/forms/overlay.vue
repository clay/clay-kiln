<style lang="sass">
  @import '../../styleguide/panes';
  @import '../../styleguide/forms';

  .kiln-toolbar-pane-form {
    @include pane();
  }

  .pane-slide-enter, .pane-slide-leave-active {
    transform: translate3d(0, 100%, 0);
  }

  .form-sections-list {
    @include pane-tab-list();
  }

  .pane-form-wrapper {
    @include form();

    height: 100%;
    max-height: calc(70vh - 44px);
  }

  .pane-tabs-content {
    @include pane-tab-content();
  }
</style>

<template>
  <transition name="pane-slide">
    <div class="kiln-toolbar-pane-form center large" v-if="hasCurrentModalForm" @click.stop>
      <pane-header :title="headerTitle" :buttonClick="save" check="publish-check"></pane-header>
      <section class="pane-form-wrapper" :style="{ height: paneHeight }">
        <form @submit.prevent="save">
          <div v-if="hasSections" class="pane-tabs-titles">
            <ul class="form-sections-list">
              <li v-for="(section, index) in sections">
                <button type="button" class="pane-tabs-titles-list-trigger" :class="{ 'active' : isActive(index) }" @click.stop="selectTab(index)">
                  <span class="pane-tab-title">{{ section.title }}</span>
                </button>
              </li>
            </ul>
            <!-- todo: add right arrow for scrolling -->
          </div>
          <div class="pane-tabs-content input-container" v-for="(section, index) in sections" v-if="isActive(index)">
            <field v-for="(field, fieldIndex) in section.fields" :class="{ 'first-field': fieldIndex === 0 }" :name="field" :data="fields[field]" :schema="componentSchema[field]"></field>
          </div>
          <button type="submit" class="hidden-submit" @click.stop></button>
        </form>
      </section>
    </div>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import { mapState } from 'vuex';
  import { displayProp, getComponentName } from '../utils/references';
  import label from '../utils/label';
  import field from './field.vue';
  import paneHeader from '../panes/pane-header.vue';

  export default {
    data() {
      return {
        activeTab: 0
      };
    },
    computed: mapState({
      hasCurrentModalForm: (state) => !_.isNull(state.ui.currentForm) && state.ui.currentForm.schema[displayProp] !== 'inline',
      headerTitle: (state) => label(state.ui.currentForm.path, state.ui.currentForm.schema),
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
      schema: (state) => state.ui.currentForm.schema,
      componentSchema: (state) => state.schemas[getComponentName(state.ui.currentForm.uri)],
      paneHeight() {
        this.$nextTick(() => {
          const el = this.$el,
            val = this.hasCurrentModalForm; // recalculate every time the form is opened

          if (val && el) {
            const $elComputedStyles = getComputedStyle(el),
              paneHeight = parseInt($elComputedStyles.height, 10),
              minHeight = parseInt(document.documentElement.clientHeight * 0.3, 10); // 30vh is minimum pane height

            // set height for tabbed forms when they mount,
            // so clicking tabs doesn't change the pane height
            if (paneHeight < minHeight) {
              el.style.height = `${minHeight}px`;
            } else {
              el.style.height = `${paneHeight}px`;
            }
          }
        });
      }
    }),
    methods: {
      save() {
        this.$store.dispatch('unfocus');
      },
      isActive(index) {
        return this.activeTab === index;
      },
      selectTab(index) {
        this.activeTab = index;
      }
    },
    components: {
      field,
      'pane-header': paneHeader
    }
  };
</script>
