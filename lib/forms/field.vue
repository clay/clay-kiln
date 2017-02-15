<template>
  <label class="input-label">
    <div class="field-before" v-for="behavior in beforeBehaviors">
      <component :is="behavior.fn" :name="name" :data="data" :schema="schema" :args="behavior.args"></component>
    </div>
    <div class="field-main" v-for="behavior in mainBehaviors">
      <component :is="behavior.fn" :name="name" :data="data" :schema="schema" :args="behavior.args"></component>
    </div>
    <div class="field-after" v-for="behavior in afterBehaviors">
      <component :is="behavior.fn" :name="name" :data="data" :schema="schema" :args="behavior.args"></component>
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
      // after is for soft-maxlength and other behaviors that go at the bottom of a field
      afterBehaviors() {
        return this.behaviors.filter((b) => b.slot === 'after');
      }
    },
    components: window.kiln.behaviors
  };
</script>
