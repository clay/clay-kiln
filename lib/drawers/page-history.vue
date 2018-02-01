<style lang="sass">
  @import '../../styleguide/colors';

  .page-history-list {
    padding: 0;

    .person-item {
      padding: 12px 16px;
    }

    .page-history-event {
      font-family: $font-stack;
      margin: 8px 13px 16px;

      &-action,
      &-time {
        float: left;
        font-size: 12px;
        text-transform: uppercase;
      }

      &-action {
        color: $text-alt-color;
        font-weight: bold;

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
      }

      &-time {
        margin-left: 5px;
      }

      &-users {
        clear:both;
        font-size: 11px;
      }
    }

    .page-history-event-time {
      color: $text-alt-color;
    }
    
    .page-history-event-users {
      color: $text-color;
    }
  }
</style>

<template>
  <div class="page-history-list">
    <div
      class="page-history-event"
      v-for="event of history"
      :key="event.timestamp"
    >
      <div 
        class="page-history-event-action"
        :class="['page-history-event-action-'+event.formattedAction]"
      >{{event.formattedAction}}</div>
      <div class="page-history-event-time">{{event.formattedTime}}</div>
      <div class="page-history-event-users">{{event.formattedUsers}}</div>

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
  import person from '../utils/person.vue';
  import UiButton from 'keen/UiButton';

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
    if (!word.length){
      return word;
    }
    else if (word[word.length-1] == "e"){
      return word+"d"
    }
    else {
      return word+"ed";
    }
  }

  export default {
    data() {
      return {};
    },
    computed: {
      history() {
        return _.map(_.cloneDeep(_.get(this.$store, 'state.page.state.history', [])), (event) => {
          event.formattedTime = formatStatusTime(event.timestamp);
          event.formattedAction = addEd(event.action);
          event.formattedUsers = 'By ' + event.users.map((user) => user.name || user.username).join(', ');
          return event;
        }).reverse();
      }
    },
    methods: {
    },
    components: {
      person,
      UiButton
    }
  };
</script>
