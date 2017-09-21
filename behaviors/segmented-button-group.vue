<docs>
  # segmented-button-group

  A group of segmented buttons allowing the user to select one of a few related options. Functions like styled radio buttons.

  ## Arguments

  * **options** _(required)_ an array of options

  Each option should be an object with `title` and `values` properties. The `values` should be an array of objects with `icon`, `text`, and `value` properties. Like `segmented-button`, if `icon`s are provided the buttons will use those rather than the text.

  _Note:_ It's best to choose either icons or text for all segments of the button, rather than interspersing them.
</docs>

<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/mixins';
  @import '../styleguide/typography';

  .segmented-button-group {
    @include clearfix();
  }

  .segmented-button-group .group {
    @include clearfix();

    margin: 5px 0 0;
    width: 100%;
  }

  .segmented-button-group .group + .group {
    margin: 10px 0;
  }

  .segmented-button-group .title {
    @include primary-text();

    float: left;
    font-weight: bold;
    text-align: left;
    margin: 5px 0 10px;
    width: 100%;
  }
</style>

<template>
  <div class="segmented-button-group">
    <div v-for="option in this.args.options" class="group">
      <span class="title">{{ option.title }}</span>
      <segmented-button :name="name" :data="data" :schema="schema" :args="{ options: option.values }"></segmented-button>
    </div>
  </div>
</template>

<script>
  import segmentedButton from './segmented-button.vue';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    components: {
      'segmented-button': segmentedButton
    },
    slot: 'main'
  };
</script>
