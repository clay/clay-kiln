<style lang="sass">
  @import '../../styleguide/layers';

  .kiln-collab-layer {
    height: 0;
    left: 0;
    pointer-events: none;
    position: fixed;
    top: 0;
    width: 0;
  }

  .kiln-collab-box {
    @include quick-bar-layer();

    border: 2px solid;
    border-radius: 3px;
    box-sizing: border-box;
    pointer-events: none;
    position: fixed;
    transition: top 120ms ease, left 120ms ease, width 120ms ease, height 120ms ease;

    &.is-flash {
      animation: kiln-collab-flash 2.5s ease-out forwards;
      border-style: solid;
    }

    &.is-typing {
      border-style: dashed;
    }
  }

  .kiln-collab-tag {
    border-radius: 3px 3px 3px 0;
    color: #fff;
    font-family: 'Noto Sans', Arial, sans-serif;
    font-size: 11px;
    font-weight: bold;
    left: -2px;
    line-height: 18px;
    max-width: 240px;
    overflow: hidden;
    padding: 0 6px;
    position: absolute;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .kiln-collab-typing-dots::after {
    animation: kiln-collab-dots 1.2s steps(4, end) infinite;
    content: '…';
    display: inline-block;
    overflow: hidden;
    vertical-align: bottom;
    width: 0;
  }

  @keyframes kiln-collab-flash {
    0% { opacity: 1; }
    70% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes kiln-collab-dots {
    to { width: 1em; }
  }
</style>

<template>
  <div class="kiln-collab-layer" aria-hidden="true">
    <div
      v-for="box in boxes"
      :key="box.key"
      class="kiln-collab-box"
      :class="{ 'is-flash': box.flash, 'is-typing': box.typing }"
      :style="box.style">
      <span class="kiln-collab-tag" :style="box.tagStyle"><span :class="{ 'kiln-collab-typing-dots': box.typing }">{{ box.text }}</span></span>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { getFieldEl } from '../utils/component-elements';
  import { focuses } from './presence';

  const TAG_HEIGHT = 18,
    TOOLBAR_HEIGHT = 60,
    // re-measure after anything that can move components around
    LAYOUT_MUTATIONS = ['RENDER_COMPONENT', 'RENDER_PAGE', 'FINISHED_DECORATING', 'OPEN_FORM', 'CLOSE_FORM', 'COLLAB_SYNCED', 'COLLAB_FLASH', 'REMOVE_COMPONENT', 'COMPONENT_ADDED'];

  /**
   * The element to outline: the field being edited if it's on the page,
   * otherwise the whole component.
   * @param {object} focus { uri, path }
   * @returns {Element|null}
   */
  function targetEl(focus) {
    const field = focus.path && getFieldEl(focus.uri, focus.path);

    return field || document.querySelector(`[data-uri="${focus.uri}"]`);
  }

  export default {
    data() {
      return { tick: 0 };
    },
    computed: {
      boxes() {
        const flashes = _.get(this.$store, 'state.collab.flashes', []),
          perEl = {},
          items = _.map(focuses(this.$store), entry => ({
            key: `f-${entry.session}`,
            focus: entry.focus,
            user: entry.user,
            typing: entry.focus.typing,
            text: `${entry.user.name}${entry.focus.typing ? ' is typing' : ' is editing'}`
          })).concat(_.map(flashes, flash => ({
            key: `x-${flash.id}`,
            focus: { uri: flash.uri },
            user: flash.user,
            flash: true,
            text: `Updated by ${flash.user.name}`
          })));

        // eslint-disable-next-line no-unused-expressions
        this.tick; // re-measure on scroll/resize/render

        return _.compact(_.map(items, (item) => {
          const el = targetEl(item.focus),
            rect = el && el.getBoundingClientRect();

          if (!rect || !rect.width && !rect.height) {
            return null;
          }

          const stack = perEl[item.focus.uri] = (perEl[item.focus.uri] || 0) + 1,
            above = rect.top > TAG_HEIGHT * stack + TOOLBAR_HEIGHT, // room above it, below the toolbar?
            // otherwise inside the top of the box, but never hidden under the toolbar
            inside = Math.max(TAG_HEIGHT * (stack - 1), TOOLBAR_HEIGHT - rect.top + TAG_HEIGHT * (stack - 1));

          if (rect.bottom < TOOLBAR_HEIGHT || rect.top > window.innerHeight) {
            return null; // scrolled out of view
          }

          return {
            key: item.key,
            flash: !!item.flash,
            typing: !!item.typing,
            text: item.text,
            style: {
              borderColor: item.user.color,
              top: `${rect.top - 3}px`,
              left: `${rect.left - 3}px`,
              width: `${rect.width + 6}px`,
              height: `${rect.height + 6}px`
            },
            tagStyle: {
              backgroundColor: item.user.color,
              top: above ? `${-TAG_HEIGHT * stack - 2}px` : `${inside}px`
            }
          };
        }));
      }
    },
    mounted() {
      this.remeasure = _.throttle(() => { this.tick++; }, 50, { leading: true, trailing: true });
      window.addEventListener('scroll', this.remeasure, { passive: true, capture: true });
      window.addEventListener('resize', this.remeasure, { passive: true });
      this.unsubscribe = this.$store.subscribe((mutation) => {
        if (_.includes(LAYOUT_MUTATIONS, mutation.type)) {
          this.$nextTick(this.remeasure);
        }
      });
      // backstop for layout shifts nothing tells us about (images loading, embeds)
      this.interval = setInterval(() => {
        if (this.boxes.length) {
          this.remeasure();
        }
      }, 1000);
    },
    beforeDestroy() {
      window.removeEventListener('scroll', this.remeasure, { capture: true });
      window.removeEventListener('resize', this.remeasure);
      clearInterval(this.interval);
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    }
  };
</script>
