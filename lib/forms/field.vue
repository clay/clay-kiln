<style lang="sass">
  @import '../../styleguide/forms';

  .kiln-field {
    @include field();

    opacity: 1;
    transition: opacity 300ms linear;
    visibility: visible;

    &.kiln-reveal-hide {
      // fade out, THEN remove the element from the space it takes up
      // (by using margin-top, which can be transitioned and thus delayed)
      margin-top: -1000px;
      opacity: 0;
      transition: visibility 0ms 300ms, margin-top 0ms 300ms, opacity 300ms linear;
      visibility: hidden;
    }
  }

  .editor-inline {
    .kiln-field {
      text-align: left; // override component styling
    }
  }
</style>

<template>
  <fieldset class="kiln-field" v-if="beforeBehaviors.length || mainBehaviors.length || afterBehaviors.length">
    <div class="field-before">
      <component v-for="behavior in beforeBehaviors" :is="behavior.fn" :name="name" :data="data" :schema="schema" :args="behavior.args"></component>
    </div>
    <div class="field-main" :class="mainLengthClass">
      <component v-for="behavior in mainBehaviors" :is="behavior.fn" :name="name" :data="data" :schema="schema" :args="behavior.args"></component>
    </div>
    <div class="field-after">
      <component v-for="behavior in afterBehaviors" :is="behavior.fn" :name="name" :data="data" :schema="schema" :args="behavior.args"></component>
    </div>
  </fieldset>
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
