<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/layers';
  @import '../../styleguide/typography';

  .kiln-collab-presence {
    align-items: center;
    display: inline-flex;
    margin-right: 8px;
    position: relative;
  }

  .kiln-collab-stack {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 18px;
    cursor: pointer;
    display: inline-flex;
    height: 36px;
    padding: 0 6px 0 10px;

    &:hover,
    &:focus {
      background: rgba(0, 0, 0, 0.15);
      outline: none;
    }
  }

  .kiln-collab-avatar {
    align-items: center;
    border: 2px solid rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    color: $md-white;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 11px;
    font-weight: bold;
    height: 28px;
    justify-content: center;
    margin-left: -8px;
    overflow: hidden;
    position: relative;
    transition: opacity 200ms ease, transform 200ms ease;
    width: 28px;

    img {
      height: 100%;
      object-fit: cover;
      width: 100%;
    }

    &.is-idle,
    &.is-hidden {
      opacity: 0.55;
    }

    &.is-editing::after {
      background: $md-green-400;
      border: 2px solid $md-white;
      border-radius: 50%;
      bottom: -2px;
      content: '';
      height: 6px;
      position: absolute;
      right: -2px;
      width: 6px;
    }
  }

  .kiln-collab-more {
    background: rgba(0, 0, 0, 0.35);
    border-color: rgba(255, 255, 255, 0.6);
  }

  .kiln-collab-live {
    color: rgba(255, 255, 255, 0.85);
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 0.04em;
    margin-right: 2px;
    text-transform: uppercase;
  }

  .kiln-collab-dot {
    background: $md-green-400;
    border-radius: 50%;
    height: 8px;
    margin-left: 6px;
    width: 8px;

    &.is-offline {
      background: $md-grey-400;
    }
  }

  .kiln-collab-panel {
    @include confirm-layer();

    background: $md-white;
    border-radius: 4px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    color: $md-grey-900;
    max-height: 70vh;
    overflow-y: auto;
    padding: 12px 0;
    position: absolute;
    right: 0;
    text-align: left;
    top: 44px;
    width: 320px;

    h3 {
      color: $md-grey-600;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 0.06em;
      margin: 4px 16px 8px;
      text-transform: uppercase;
    }
  }

  .kiln-collab-person {
    align-items: center;
    display: flex;
    padding: 6px 16px;

    .kiln-collab-avatar {
      margin-left: 0;
      margin-right: 12px;
    }
  }

  .kiln-collab-person-text {
    flex: 1 1 auto;
    min-width: 0;
  }

  .kiln-collab-name {
    font-size: 14px;
    font-weight: bold;
  }

  .kiln-collab-doing {
    color: $md-grey-600;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .kiln-collab-jump {
    background: transparent;
    border: 1px solid $md-grey-300;
    border-radius: 3px;
    color: $md-grey-800;
    cursor: pointer;
    font-size: 12px;
    padding: 4px 8px;

    &:hover {
      background: $md-grey-100;
    }
  }

  .kiln-collab-empty,
  .kiln-collab-note {
    color: $md-grey-600;
    font-size: 13px;
    margin: 0 16px 8px;
  }

  .kiln-collab-activity {
    font-size: 13px;
    list-style: none;
    margin: 0;
    padding: 0 16px;

    li {
      line-height: 1.4;
      padding: 3px 0;
    }

    time {
      color: $md-grey-500;
      font-size: 12px;
      margin-left: 4px;
    }
  }

  .kiln-collab-sr {
    height: 1px;
    left: -10000px;
    overflow: hidden;
    position: absolute;
    width: 1px;
  }
</style>

<template>
  <div class="kiln-collab kiln-collab-presence" role="region" aria-label="People on this page" v-click-outside="close" @keydown.esc.stop="closeAndFocus">
    <button type="button" ref="stack" class="kiln-collab-stack" :aria-expanded="open ? 'true' : 'false'" :aria-label="summary" :title="summary" @click.stop="toggle">
      <span v-if="!people.length" class="kiln-collab-live">Live</span>
      <span
        v-for="person in shown"
        :key="person.user.id"
        class="kiln-collab-avatar"
        :class="['is-' + person.state, { 'is-editing': !!person.focus }]"
        :style="{ backgroundColor: person.user.color }"
        :aria-label="person.user.name + ', ' + doing(person)"
        aria-hidden="true">
        <img v-if="person.user.imageUrl" :src="person.user.imageUrl" alt="">
        <span v-else>{{ initialsOf(person.user.name) }}</span>
      </span>
      <span v-if="overflow" class="kiln-collab-avatar kiln-collab-more">+{{ overflow }}</span>
      <span class="kiln-collab-dot" :class="{ 'is-offline': !connected }"></span>
    </button>

    <div v-if="open" ref="panel" class="kiln-collab-panel" role="dialog" aria-label="People on this page and recent changes" tabindex="-1" @click.stop>
      <h3>On this page</h3>
      <p v-if="!people.length" class="kiln-collab-empty">Just you. Anyone who opens this page will show up here.</p>
      <div v-for="person in people" :key="'p' + person.user.id" class="kiln-collab-person">
        <span class="kiln-collab-avatar" :class="'is-' + person.state" :style="{ backgroundColor: person.user.color }">
          <img v-if="person.user.imageUrl" :src="person.user.imageUrl" alt="">
          <span v-else>{{ initialsOf(person.user.name) }}</span>
        </span>
        <div class="kiln-collab-person-text">
          <div class="kiln-collab-name">{{ person.user.name }}<span v-if="person.sessions > 1"> ({{ person.sessions }} tabs)</span></div>
          <div class="kiln-collab-doing">{{ doing(person) }}</div>
        </div>
        <button v-if="person.focus" type="button" class="kiln-collab-jump" @click="jumpTo(person)">Show</button>
      </div>

      <template v-if="activity.length">
        <h3>Recent changes</h3>
        <ul class="kiln-collab-activity">
          <li v-for="entry in activity" :key="'a' + entry.id">
            <strong>{{ entry.user ? entry.user.name : 'Someone' }}</strong> {{ entry.labels ? 'edited ' + entry.labels.join(', ') : entry.text }}<time :datetime="isoTime(entry.at)">{{ ago(entry.at) }}</time>
          </li>
        </ul>
      </template>

      <p v-if="!connected" class="kiln-collab-note">Reconnecting to live collaboration… Your edits still save normally.</p>
    </div>

    <div class="kiln-collab-sr" aria-live="polite">{{ announcement }}</div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { editors, describe, initials } from './presence';
  import { cssEscape } from './remote';
  import { COLLAB_FLASH, COLLAB_FLASH_DONE } from './mutationTypes';

  const MAX_SHOWN = 3;

  export default {
    data() {
      return { open: false, now: Date.now(), announcement: '' };
    },
    computed: {
      collab() {
        return this.$store.state.collab;
      },
      connected() {
        return !!(this.collab && (this.collab.connected || !this.collab.failures));
      },
      people() {
        return editors(this.$store);
      },
      shown() {
        return _.take(this.people, MAX_SHOWN);
      },
      overflow() {
        return Math.max(0, this.people.length - MAX_SHOWN);
      },
      activity() {
        return _.take(_.get(this.collab, 'activity', []), 10);
      },
      summary() {
        if (!this.connected) {
          return 'Reconnecting to live collaboration… Your edits still save normally.';
        }

        if (!this.people.length) {
          return 'Live collaboration is on. Nobody else is on this page.';
        }

        return _.map(this.people, person => `${person.user.name}: ${describe(person)}`).join('. ');
      }
    },
    watch: {
      activity(current, previous) {
        const latest = current[0];

        // screen readers: what other people just changed (presence is otherwise visual)
        if (latest && (!previous[0] || latest.id !== previous[0].id || latest.at !== previous[0].at)) {
          this.announcement = `${latest.user ? latest.user.name : 'Someone'} ${latest.labels ? `edited ${latest.labels.join(', ')}` : latest.text}`;
        }
      },
      people(current, previous) {
        const before = _.map(previous, 'user.id'),
          after = _.map(current, 'user.id'),
          joined = _.filter(current, person => !_.includes(before, person.user.id)),
          left = _.filter(previous, person => !_.includes(after, person.user.id));

        // screen readers: who came and went
        this.announcement = _.compact([
          joined.length ? `${_.map(joined, 'user.name').join(', ')} joined` : '',
          left.length ? `${_.map(left, 'user.name').join(', ')} left` : ''
        ]).join('. ');
      }
    },
    mounted() {
      this.clock = setInterval(() => { this.now = Date.now(); }, 30000);
    },
    beforeDestroy() {
      clearInterval(this.clock);
    },
    methods: {
      toggle() {
        this.open = !this.open;
        this.now = Date.now();
        if (this.open) {
          this.$nextTick(() => this.$refs.panel && this.$refs.panel.focus());
        }
      },
      close() {
        this.open = false;
      },
      closeAndFocus() {
        if (this.open) {
          this.open = false;
          this.$refs.stack.focus();
        }
      },
      doing(person) {
        return describe(person);
      },
      initialsOf(name) {
        return initials(name);
      },
      isoTime(at) {
        return new Date(at).toISOString();
      },
      ago(at) {
        const seconds = Math.max(0, Math.round((this.now - at) / 1000));

        if (seconds < 60) {
          return 'just now';
        } else if (seconds < 3600) {
          return `${Math.round(seconds / 60)}m ago`;
        }

        return `${Math.round(seconds / 3600)}h ago`;
      },
      jumpTo(person) {
        const el = document.querySelector(`[data-uri="${cssEscape(person.focus.uri)}"]`),
          id = `jump-${Date.now()}`;

        if (!el) {
          return;
        }

        this.open = false;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.$store.commit(COLLAB_FLASH, { id, uri: person.focus.uri, user: person.user });
        setTimeout(() => this.$store.commit(COLLAB_FLASH_DONE, id), 2500);
      }
    }
  };
</script>
