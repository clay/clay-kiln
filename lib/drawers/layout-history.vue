<style lang="sass">
  @import '../../styleguide/colors';

  .layout-history-list {
    padding: 0;

    .layout-history-event {
      align-items: flex-start;
      display: flex;
      flex-direction: row;
      font-family: $font-stack;
      margin: 12px 16px;

      .person-image {
        &.stacked {
          box-shadow: $shadow-2dp, 0 10px $text-alt-color;
        }
      }
      &-info {
        align-items: flex-start;
        display: flex;
        flex-direction: column;
      }


      &-action,
      &-time {
        font-size: 12px;

      }

      &-action {
        color: $text-color;
        font-weight: bold;
        text-transform: uppercase;

        &-published {
          color: $published;
        }

        &-scheduled {
          color: $scheduled;
        }

        &-archived,
        &-unarchived,
        &-unpublished,
        &-unscheduled {
          color: $archived;
        }

        &-edited {
          +.layout-history-event-time {
            display: none;
          }
        }
      }

      &-users {
        font-size: 11px;
      }
    }

    .layout-history-event-time {
      color: $text-alt-color;
    }

    .layout-history-event-users {
      color: $text-color;

      p {
        margin: 0;
      }
    }
  }
</style>

<template>
  <div class="layout-history-list">
    <div
      class="layout-history-event"
      v-for="event of history"
      :key="event.timestamp"
    >
      <avatar
        class="person-image"
        :class="{'stacked': event.avatar.stacked}"
        :url="event.avatar.imageUrl"
        :name="event.avatar.name"
        @click.stop="onClick">
      </avatar>
      <div class = "layout-history-event-info">
        <div
          class="layout-history-event-action"
          :class="['layout-history-event-action-'+event.formattedAction]"
        >{{event.formattedAction}}</div>
        <div class="layout-history-event-time">{{event.formattedTime}}</div>
        <div class="layout-history-event-users">
          <p v-for="(user, index) in event.users.reverse()">
            <span v-if="index === 0">By </span>{{user.name || user.username}}<span v-if="index+1 < event.users.length">, <br/></span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import isValidDate from 'date-fns/is_valid';
  import dateFormat from 'date-fns/format';
  import isToday from 'date-fns/is_today';
  import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
  import isTomorrow from 'date-fns/is_tomorrow';
  import isYesterday from 'date-fns/is_yesterday';
  import isThisYear from 'date-fns/is_this_year';
  import avatar from '../utils/avatar.vue';
  import UiButton from 'keen/UiButton';
  import store from '../core-data/store';

  /**
   * format time for pages
   * @param  {Date} date
   * @return {string}
   */
  function formatStatusTime(date) {
    date = date ? new Date(date) : null;

    if (!date || !isValidDate(date)) {
      return null;
    }

    if (isToday(date)) {
      return distanceInWordsToNow(date, { includeSeconds: false, addSuffix: true });
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (isThisYear(date)) {
      return dateFormat(date, 'M/D');
    } else {
      return dateFormat(date, 'M/D/YY');
    }
  }

  function addEd(word) {
    if (!word.length) {
      return word;
    } else if (word[word.length - 1] === 'e') {
      return `${word}d`;
    } else {
      return `${word}ed`;
    }
  }

  export default {
    data() {
      return {};
    },
    computed: {
      history() {
        let history = _.map(_.cloneDeep(_.get(this.$store, 'state.layout.state.history', [])), (event) => {
          event.formattedTime = formatStatusTime(event.timestamp);
          event.formattedAction = addEd(event.action);
          // event.formattedUsers = 'By ' + event.users.map((user) => user.name || user.username).join(', ');
          if (event.users.length > 0) {
            event.avatar = {
              name: event.users.slice(-1)[0].name || event.users.slice(-1)[0].username,
              imageUrl: event.users.slice(-1)[0].imageUrl,
              stacked: event.users.length > 1
            };
          } else {
            event.avatar = {};
          }

          return event;
        }).reverse();

        // remove unschedule events created by the clay robot
        history = history.filter(event => !(event.action === 'unschedule' && _.find(event.users, user => user.username === 'robot' && user.provider === 'clay')));

        return history;
      }
    },
    mounted: function () {
      store.dispatch('fetchLayoutState');
    },
    components: {
      UiButton,
      avatar
    }
  };
</script>
