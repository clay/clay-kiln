<style lang="sass">
  @import '../../styleguide/forms';
  @import '../../styleguide/layers';

  .editor-inline {
    @include form();
    @include inline-form-layer();

    max-width: 90vw;
    margin: 0 auto;

    .input-container {
      overflow: visible;
      padding: 0;
    }
  }

  // when inline forms are opened, the other children of the parent element are hidden
  .hidden-wrapped {
    display: none;
  }
</style>

<template>
  <section class="editor-inline" @click.stop="unsetInvalidDrag">
    <form @submit.prevent="save">
      <div class="input-container">
        <field class="first-field" :name="path" :data="data" :schema="schema"></field>
      </div>
      <button type="submit" class="hidden-submit" @click.stop></button>
    </form>
  </section>
</template>

<script>
  import _ from 'lodash';
  import store from '../core-data/store';
  import field from './field.vue';

  export default {
    data() {
      return {};
    },
    store,
    computed: {
      path() {
        return _.get(store, 'state.ui.currentForm.path');
      },
      data() {
        return _.get(store, `state.ui.currentForm.fields['${this.path}']`);
      },
      schema() {
        return _.get(store, 'state.ui.currentForm.schema');
      }
    },
    methods: {
      save() {
        store.dispatch('unfocus');
      },
      unsetInvalidDrag() {
        // unset isInvalidDrag after clicking somewhere in the form
        window.kiln.isInvalidDrag = false;
      }
    },
    components: {
      field
    },
    beforeCreate() {
      // because inline forms don't live inside the regular Vue tree,
      // we need to manually inject $store before they're created.
      // this allows the computed properties and child components to use this.$store as normal
      this.$store = store;
    }
  };
</script>
