<style lang="sass">
  @import '../../styleguide/forms';

  .kiln-field {
    @include field();
  }

  .editor-inline {

    .kiln-field {
      text-align: left; // override component styling
    }

    .kiln-field + .kiln-field {
      margin-top: 15px;
    }
  }
</style>

<template>
  <label class="kiln-field">
    <div class="field-before">
      <component v-for="behavior in beforeBehaviors" :is="behavior.fn" :name="name" :data="data" :schema="schema" :args="behavior.args"></component>
    </div>
    <div class="field-main" :class="mainLengthClass">
      <component v-for="behavior in mainBehaviors" :is="behavior.fn" :name="name" :data="data" :schema="schema" :args="behavior.args"></component>
    </div>
    <div class="field-after">
      <component v-for="behavior in afterBehaviors" :is="behavior.fn" :name="name" :data="data" :schema="schema" :args="behavior.args"></component>
    </div>
  </label>
</template>

<script>
  import { fieldProp } from '../utils/references';
  import { expand } from './behaviors';

  export default {
    props: ['name', 'data', 'schema'],
    data() {
      return {};
    },
    computed: {
      behaviors() {
        return expand(this.schema[fieldProp]);
      },
      // behaviors are added to the slot they expose (in exports.slot)
      // before is for label, description, and other behaviors that go at the top of a field
      beforeBehaviors() {
        return this.behaviors.filter((b) => b.slot === 'before');
      },
      // main is the main input of a field. it _should_ only have one behavior
      mainBehaviors() {
        return this.behaviors.filter((b) => b.slot === 'main');
      },
      mainLengthClass() {
        return `main-${this.mainBehaviors.length}`;
      },
      // after is for soft-maxlength and other behaviors that go at the bottom of a field
      afterBehaviors() {
        return this.behaviors.filter((b) => b.slot === 'after');
      }
    },
    components: window.kiln.behaviors
  };
</script>
