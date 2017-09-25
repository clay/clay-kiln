<docs>
  # lock

  Append a lock button to an input. The input will be locked until the user clicks the lock button. This provides a small amount of friction before editing important (and rarely-edited) fields, similar to macOS's system preferences.
</docs>

<style lang="sass">
  @import '../styleguide/buttons';

  @keyframes jiggle {
    0%, 100% {transform: rotate(0deg);}
    20%, 60% {transform: rotate(-10deg);}
    40%, 80% {transform: rotate(10deg);}
  }

  .lock-button {
    @include button-outlined($input-border, $input-background);

    border-bottom-left-radius: 0;
    border-left: none;
    border-top-left-radius: 0;
    clear: right;
    float: right;
    height: 48px; // to match inputs
    margin: 0;
    padding: 6px 10px 4px;
    position: relative;
    right: 0;
    top: 0; // allow 1px for border
    width: 44px; // explicit width, see below

    svg {
      height: 24px;
      width: 17px;
    }

    .locked {
      display: block;
    }

    .unlocked {
      display: none;
    }

    &.unlocked {
      padding-top: 4px;

      .locked {
        display: none;
      }

      .unlocked {
        display: block;
      }
    }

    &.jiggle .locked {
      animation-name: jiggle;
      animation-duration: 600ms;
      animation-fill-mode: both;
    }
  }
</style>

<template>
  <button type="button" class="lock-button" :class="{ unlocked: !locked }" @click.stop.prevent="toggleLock">
    <ui-icon name="lock_outline" class="locked"></ui-icon>
    <ui-icon name="lock_open" class="unlocked"></ui-icon>
  </button>
</template>

<script>
  import { getInput } from '../lib/forms/field-helpers';
  import UiIcon from 'keen/UiIcon';

  function jiggle(input, el) {
    el.classList.add('jiggle'); // trigger the jiggle animation
    setTimeout(() => el.classList.remove('jiggle'), 601); // length of the animation + 1
  }

  function lock(input, el) {
    input.setAttribute('disabled', true);
    input.parentNode.addEventListener('click', jiggle.bind(null, input, el));
  }

  function unlock(input) {
    input.removeAttribute('disabled');
    input.parentNode.removeEventListener('click', jiggle);
  }

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        locked: true
      };
    },
    components: {
      UiIcon
    },
    methods: {
      toggleLock() {
        const el = this.$el,
          input = getInput(el);

        if (this.locked) {
          // unlock!
          unlock(input);
          this.locked = false;
        } else {
          // lock it again!
          lock(input, el);
          this.locked = true;
        }
      }
    },
    mounted() {
      const el = this.$el,
        input = getInput(el);

      lock(input, el);
    },
    slot: 'main'
  };
</script>
