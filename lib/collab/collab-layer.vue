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

    &.is-pending {
      border-style: dotted;

      .kiln-collab-tag {
        max-width: 400px;
      }
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

  .kiln-collab-edge {
    @include quick-bar-layer();

    border: 0;
    border-radius: 12px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    color: #fff;
    cursor: pointer;
    font-family: 'Noto Sans', Arial, sans-serif;
    font-size: 12px;
    font-weight: bold;
    left: 50%;
    line-height: 24px;
    max-width: 80vw;
    overflow: hidden;
    padding: 0 12px;
    pointer-events: auto;
    position: fixed;
    text-overflow: ellipsis;
    transform: translateX(-50%);
    white-space: nowrap;

    &.is-below {
      bottom: 16px;
    }

    &.is-above {
      top: 72px;
    }
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
  <div class="kiln-collab kiln-collab-layer">
    <template v-for="box in boxes">
      <button
        v-if="box.edge"
        :key="box.key"
        type="button"
        class="kiln-collab-edge"
        :class="'is-' + box.edge"
        :style="box.tagStyle"
        @click.stop="jumpTo(box.uri)">{{ box.edge === 'below' ? '↓' : '↑' }} {{ box.text }}</button>
      <div
        v-else
        :key="box.key"
        class="kiln-collab-box"
        aria-hidden="true"
        :class="{ 'is-flash': box.flash, 'is-typing': box.typing, 'is-pending': box.pending }"
        :style="box.style">
        <span class="kiln-collab-tag" :style="box.tagStyle"><span :class="{ 'kiln-collab-typing-dots': box.typing }">{{ box.text }}</span></span>
      </div>
    </template>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { getFieldEl } from '../utils/component-elements';
  import { focuses } from './presence';
  import { cssEscape } from './remote';

  const TAG_HEIGHT = 18,
    TOOLBAR_HEIGHT = 60,
    // re-measure after anything that can move components around
    LAYOUT_MUTATIONS = ['RENDER_COMPONENT', 'RENDER_PAGE', 'FINISHED_DECORATING', 'OPEN_FORM', 'CLOSE_FORM', 'COLLAB_SYNCED', 'COLLAB_FLASH', 'COLLAB_PENDING', 'COLLAB_PENDING_DONE', 'REMOVE_COMPONENT', 'COMPONENT_ADDED'];

  /**
   * The element to outline: the field being edited if it's on the page,
   * otherwise the whole component.
   * @param {object} focus { uri, path }
   * @returns {Element|null}
   */
  function targetEl(focus) {
    const field = focus.path && getFieldEl(focus.uri, focus.path);

    return field || document.querySelector(`[data-uri="${cssEscape(focus.uri)}"]`);
  }

  /**
   * One pill per screen edge: several people out of view above (or below)
   * share it.
   * @param {object[]} boxes
   * @returns {object[]}
   */
  function groupEdges(boxes) {
    const [edges, rest] = _.partition(boxes, 'edge');

    return rest.concat(_.map(_.groupBy(edges, 'edge'), (group, edge) => group.length === 1 ? group[0] : {
      key: `edge-${edge}`,
      edge,
      uri: group[0].uri,
      text: `${_.map(group, box => box.text.split(' is ')[0]).join(', ')} are editing ${edge === 'below' ? 'below' : 'above'}`,
      tagStyle: group[0].tagStyle
    }));
  }

  export default {
    data() {
      return { tick: 0 };
    },
    computed: {
      boxes() {
        const flashes = _.get(this.$store, 'state.collab.flashes', []),
          pending = _.get(this.$store, 'state.collab.pending', {}),
          openUri = _.get(this.$store, 'state.ui.currentForm.uri'),
          perEl = {},
          items = _.map(focuses(this.$store), entry => ({
            key: `f-${entry.tab}`,
            focus: entry.focus,
            label: entry.focus.label,
            user: entry.user,
            typing: entry.focus.typing,
            text: `${entry.user.name}${entry.focus.typing ? ' is typing' : ' is editing'}`
          })).concat(_.compact(_.map(pending, (change, uri) => uri === openUri && _.get(change, 'by.user') ? {
            // someone changed what this user has open: their change shows once it's closed
            // (only on the open component itself: containers it sits in wait quietly)
            key: `p-${uri}`,
            focus: { uri },
            user: change.by.user,
            pending: true,
            text: `${change.by.user.name} changed this too · updates when you're done`
          } : null))).concat(_.map(flashes, flash => ({
            key: `x-${flash.id}`,
            focus: { uri: flash.uri },
            user: flash.user,
            flash: true,
            text: `Updated by ${flash.user.name}`
          })));

        // eslint-disable-next-line no-unused-expressions
        this.tick; // re-measure on scroll/resize/render

        return groupEdges(_.compact(_.map(items, (item) => {
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
            // out of view: point at it from the edge of the screen instead
            return item.flash ? null : {
              key: `${item.key}-edge`,
              edge: rect.top > window.innerHeight ? 'below' : 'above',
              uri: item.focus.uri,
              text: `${item.user.name} is ${item.typing ? 'typing' : 'editing'}${item.focus.label ? ` · ${item.focus.label}` : ''}`,
              tagStyle: { backgroundColor: item.user.color }
            };
          }

          return {
            key: item.key,
            flash: !!item.flash,
            typing: !!item.typing,
            pending: !!item.pending,
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
        })));
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
    methods: {
      jumpTo(uri) {
        const el = document.querySelector(`[data-uri="${cssEscape(uri)}"]`);

        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
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
