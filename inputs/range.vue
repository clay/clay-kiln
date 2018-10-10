<docs>
  # `range`

  A slider that allows selecting between a range of numerical values. May use two points (known as a _dual-point range_). Uses [noUISlider](https://refreshless.com/nouislider/) under the hood, styled based on [KeenUI's slider](https://josephuspaye.github.io/Keen-UI/#/ui-slider).

  ```yaml
      input: range
      min: 0
      max: 10
  ```

  ### Range Arguments

  * **start** - default value, or an array of _two_ values (for dual-point ranges)
  * **min** - hardcoded minimum value selectable in the range, defaults to `0`
  * **max** - hardcoded maximum value selectable in the range, defaults to `10`
  * **minLabel** - label that will be displayed on the left side of the range, defaults to the `min` value
  * **maxLabel** - label that will be displayed on the right side of the range, defaults to the `max` value
  * **step** - define step increments, defaults to `1`,
  * **tooltips** - boolean that determines whether value tooltips will display above the points
  * **help** - description / helper text for the field
  * **validate.min** - minimum value allowed
  * **validate.max** - maximum value allowed
  * **validate.minMessage** - will appear when minimum validation fails
  * **validate.maxMessage** - will appear when maximum validation fails

  Note that you should use `min`/`max` to set the hardcoded limits for the range input and `validate.min`/`validate.max` to set a (more limited) _publishable_ range, if necessary.
</docs>

<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/typography';

  /* use variables and styling from KeenUI's UISlider component */

  // Track line
  $ui-slider-track-height: 3px;
  $ui-slider-track-fill-color: $brand-accent-color;
  $ui-slider-track-background-color: rgba($md-black, .12);

  // Drag thumb
  $ui-track-thumb-size: 14px;
  $ui-track-thumb-fill-color: $brand-accent-color;
  // Focus ring
  $ui-track-focus-ring-size: 36px;
  $ui-track-focus-ring-transition-duration: .2s;
  $ui-track-focus-ring-color: rgba($ui-track-thumb-fill-color, .38);
  // Marker
  $ui-slider-marker-size: 36px;

  .editor-range {
    .noUi-target {
      -webkit-tap-highlight-color: rgba(0,0,0,0);
      -webkit-touch-callout: none;
      background: $ui-slider-track-background-color;
      box-sizing: border-box;
      height: $ui-slider-track-height;
      margin: 20px 0 10px;
      position: relative;
    	touch-action: none;
    	user-select: none;
    }

    .noUi-base,
    .noUi-connects {
      height: 100%;
    	position: relative;
      width: 100%;
    	z-index: 1;
    }

    .noUi-connects {
      overflow: hidden;
    	z-index: 0;
    }

    .noUi-connect,
    .noUi-origin {
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      transform-origin: 0 0;
      width: 100%;
      will-change: transform;
      z-index: 1;
    }

    .noUi-connect {
      background: $ui-slider-track-fill-color;
    }

    .noUi-origin {
      height: 0;
      left: auto;
      right: 0;
    }

    .noUi-handle {
      background: $ui-track-thumb-fill-color;
      border-radius: 50%;
      cursor: default;
      height: $ui-track-thumb-size;
      left: auto;
      position: absolute;
      right: $ui-track-thumb-size / -2;
      top: $ui-track-thumb-size / -2 + 1;
      width: $ui-track-thumb-size;

      &:before {
          background-color: $ui-track-focus-ring-color;
          border-radius: 50%;
          content: '';
          display: block;
          height: $ui-track-focus-ring-size;
          left: -($ui-track-focus-ring-size - $ui-track-thumb-size) / 2;
          position: absolute;
          top: -($ui-track-focus-ring-size - $ui-track-thumb-size) / 2;
          transform-origin: center;
          transform: scale(0);
          transition: transform $ui-track-focus-ring-transition-duration ease;
          width: $ui-track-focus-ring-size;
      }
    }

    .noUi-state-tap .noUi-connect,
    .noUi-state-tap .noUi-origin {
      transition: transform .3s;
    }

    .noUi-state-drag * {
      cursor: inherit;
    }

    .noUi-draggable {
      cursor: ew-resize;
    }

    &:not(.has-tooltips) .noUi-active:before,
    &:not(.has-tooltips) .noUi-handle:focus:before {
      transform: scale(1);
    }

    .noUi-tooltip {
      @include kiln-copy();

      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='36' height='36'%3E%3Cpath fill='%231976d2' d='M11 .5c-1.7.2-3.4.9-4.7 2-1.1.9-2 2-2.5 3.2-1.2 2.4-1.2 5.1-.1 7.7 1.1 2.6 2.8 5 5.3 7.5 1.2 1.2 2.8 2.7 3 2.7 0 0 .3-.2.6-.5 3.2-2.7 5.6-5.6 7.1-8.5.8-1.5 1.1-2.6 1.3-3.8.2-1.4 0-2.9-.5-4.3-1.2-3.2-4.1-5.4-7.5-5.8-.5-.2-1.5-.2-2-.2z'/%3E%3C/svg%3E");
      background-size: $ui-slider-marker-size $ui-slider-marker-size;
      color: $md-white;
      display: block;
      font-size: 13px;
      font-weight: 600;
      height: $ui-slider-marker-size;
      line-height: 13px;
      margin-left: -($ui-slider-marker-size - $ui-track-thumb-size) / 2;
      margin-top: -($ui-slider-marker-size - $ui-track-thumb-size) / 2;
      opacity: 0;
      padding-top: 8px;
      position: absolute;
      text-align: center;
      transform: scale(0) translateY(0) ;
      transition: all $ui-track-focus-ring-transition-duration ease;
      user-select: none;
      white-space: nowrap;
      width: $ui-slider-marker-size;
    }

    .noUi-active .noUi-tooltip,
    .noUi-handle:focus .noUi-tooltip {
      opacity: 1;
      transform: scale(1) translateY(-26px);
    }
  }
</style>

<template>
  <div class="editor-range ui-textbox has-label has-floating-label" :class="rangeClasses">
    <div class="ui-textbox__content">
      <label class="ui-textbox__label">
        <div class="ui-textbox__label-text is-floating">{{ label }}</div>
        <div class="editor-range-input"></div>
      </label>

      <div class="ui-textbox__feedback" v-if="hasFeedback || showError">
        <div class="ui-textbox__feedback-text" v-if="showError">{{ error }}</div>
        <div class="ui-textbox__feedback-text" v-else>{{ args.help }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import slider from 'nouislider';
  import keycode from 'keycode';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import label from '../lib/utils/label';
  import { getValidationError } from '../lib/forms/field-helpers';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        values: this.data || this.isDualPoint ? [0, 0] : 0
      };
    },
    computed: {
      label() {
        return label(this.name, this.schema);
      },
      start() {
        return this.args.start || 0;
      },
      isDualPoint() {
        return _.isArray(this.start);
      },
      step() {
        return this.args.step || 1;
      },
      min() {
        return this.args.min || 0;
      },
      max() {
        return this.args.max || 10;
      },
      minLabel() {
        return this.args.minLabel || this.min.toString();
      },
      maxLabel() {
        return this.args.maxLabel || this.max.toString();
      },
      tooltips() {
        return !!this.args.tooltips;
      },
      errorMessage() {
        return getValidationError(this.data, this.args.validate, this.$store, this.name);
      },
      showError() {
        return !!this.errorMessage;
      },
      hasFeedback() {
        return this.args.help || this.showError;
      },
      rangeClasses() {
        return {
          'has-tooltips': this.args.tooltips
        };
      }
    },
    methods: {
      update(val) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: val });
      }
    },
    mounted() {
      const el = find(this.$el, '.editor-range-input'),
        step = this.step;

      let handle;

      slider.create(el, {
        start: this.start,
        step: step,
        range: {
          min: this.min,
          max: this.max
        },
        format: {
          to(val) {
            return step >= 1 ? parseInt(val) : val;
          },
          from(val) {
            return step >= 1 ? parseInt(val) : val;
          }
        },
        connect: this.isDualPoint ? [false, true, false] : [true, false],
        tooltips: this.tooltips
      });

      // add keyboard support
      handle = find(el, '.noUi-handle');
      if (handle) {
        handle.addEventListener('keydown', (e) => {
          const key = keycode(e),
            val = new Number(el.noUiSlider.get());

          if (key === 'left' && val > this.min) {
            el.noUiSlider.set(val - this.step);
          }
          if (key === 'right' && val < this.max) {
            el.noUiSlider.set(val + this.step);
          }
        });
      }
    }
  };
</script>
