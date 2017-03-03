<docs>
  # segmented-button

  A group of buttons allowing the user to select one of a few related options. Functions like a styled radio button.

  ## Arguments

  * **options** _(required)_ an array of options

  Each option should be an object with `icon`, `text`, and `value` properties. If `icon`s are provided the buttons will use those rather than the text.

  _Note:_ It's best to choose either icons or text for all segments of the button, rather than interspersing them.
</docs>

<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/mixins';

  .segmented-button {
    @include clearfix();

    clear: both;
    // margin: 5px 0 10px;
  }

  .segmented-button input[type=radio] {
    display: none;
  }

  // labels
  .segmented-button label {
    background-color: $toolbar-icons;
    border-bottom: 1px solid $save;
    border-left: 1px solid $save;
    border-top: 1px solid $save;
    cursor: pointer;
    display: block;
    float: left;
    margin: 0;
    padding: 4px 8px;
  }

  .segmented-button label:last-of-type {
    border-right: 1px solid $save;
  }

  // rounded borders on first and last button
  $btnradius: 4px;

  .segmented-button label:nth-of-type(1) {
    border-bottom-left-radius: $btnradius;
    border-top-left-radius: $btnradius;
  }

  .segmented-button label:nth-last-of-type(1) {
    border-bottom-right-radius: $btnradius;
    border-top-right-radius: $btnradius;
  }

  // checked style
  .segmented-button label.checked {
    background-color: $text-selection;
  }

  // icons
  .segmented-button img {
    height: auto;
    min-height: 30px;
    width: 34px;
  }
</style>

<template>
  <div class="segmented-button">
    <input type="radio" v-for="option in options" :name="name" :id="option.id" :checked="option.checked" :value="option.value" @change="update" />
    <label v-for="option in options" :class="{ checked: option.checked }" :for="option.id" :title="option.title">
      <img v-if="option.icon" :src="option.icon" :alt="option.text" />
      <span v-else>{{ option.text }}</span>
    </label>
  </div>
</template>

<script>
  import _ from 'lodash';
  import cid from '@nymag/cid';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';

    /**
   * format values for use in title attributes (for mouseover tooltips)
   * @param {string} val
   * @returns {string}
   */
  function getTitle(val) {
    return val.split('-').map(_.startCase).join(' ');
  }

  function getAssetPath(store) {
    return _.get(store, 'state.site.assetPath');
  }

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      options() {
        const data = this.data,
          assetPath = getAssetPath(this.$store);

        return _.map(this.args.options, (option) => {
          return {
            id: cid(),
            value: option.value,
            icon: option.icon ? `${assetPath}${option.icon}` : null,
            text: option.text || option.value,
            title: getTitle(option.value),
            checked: option.value === data
          };
        });
      }
    },
    methods: {
      update(e) {
        const value = e.target.value;

        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: value });
      }
    },
    slot: 'main'
  };
</script>
