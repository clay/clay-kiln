<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/buttons';
  @import '../../styleguide/inputs';

  .page-actions {
    &-head {
      align-items: center;
      display: flex;
      justify-content: space-between;
      margin-bottom: 13px;

      &-input {
        width: 48%;

        input {
          @include input();
        }
      }
    }

    &-foot {
      &-btn {
        @include button-outlined($published);

        height: auto;
        font-size: 16px;
        margin: 0;
        padding: 15px 0;
        width: 100%;
      }

      &-btn.schedule {
        border-color: $scheduled;
        color: $scheduled;
      }
    }
  }
</style>

<template>
  <div class="page-actions">
    <div class="page-actions-head">
      <div class="page-actions-head-input">
        <label>
          Date
          <input type="date" ref="date" v-model="dateValue"/>
        </label>
      </div>
      <div class="page-actions-head-input">
        <label>
          Time
          <input type="time" ref="time" v-model="timeValue"/>
        </label>
      </div>
    </div>
    <div class="page-actions-foot">
      <button
        type="button"
        class="page-actions-foot-btn publish"
        v-if="!showSchedule"
        @click.stop="onPublishClick">Publish Now</button>
      <button
        type="button"
        class="page-actions-foot-btn schedule"
        v-if="showSchedule"
        @click.stop="onScheduleClick">Schedule Now</button>
    </div>
  </div>
</template>


<script>
  import _ from 'lodash';
  import parseDate from 'date-fns/parse';
  import dateFormat from 'date-fns/format';
  import getTime from 'date-fns/get_time';
  import isSameDay from 'date-fns/is_same_day';
  import isYesterday from 'date-fns/is_yesterday';
  import isTomorrow from 'date-fns/is_tomorrow';
  import addWeeks from 'date-fns/add_weeks';
  import subWeeks from 'date-fns/sub_weeks';
  import isThisWeek from 'date-fns/is_this_week';
  import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
  import { hasNativePicker, init as initPicker } from '../../lib/utils/datepicker';
  import { START_PROGRESS, FINISH_PROGRESS } from '../../lib/toolbar/mutationTypes';

  function calendar(date) {
    if (isSameDay(now, date)) {
      // today
      return distanceInWordsToNow(date, { includeSeconds: true, addSuffix: true });
    } else if (isYesterday(date)) {
      // yesterday
      return `Yesterday at ${dateFormat(date, 'h:mm A')}`;
    } else if (isTomorrow(date)) {
      // tomorrow
      return `Tomorrow at ${dateFormat(date, 'h:mm A')}`;
    } else if (isThisWeek(addWeeks(date, 1))) {
      // last week
      return `Last ${dateFormat(date, 'dddd [at] h:mm A')}`;
    } else if (isThisWeek(subWeeks(date, 1))) {
      // next week
      return dateFormat(date, 'dddd [at] h:mm A');
    } else {
      return dateFormat(date, 'M/D/YYYY [at] h:mm A');
    }
  }

  export default {
    props: [],
    data() {
      return {
        dateValue: '',
        timeValue: ''
      };
    },
    computed: {
      showSchedule() {
        return this.dateValue && this.timeValue;
      }
    },
    methods: {
      onPublishClick() {
        const store = this.$store;

        this.$store.dispatch('closePane');
        this.$store.dispatch('publishPage', this.$store.state.page.uri)
          .catch((e) => {
            console.error('Error publishing page:', e);
            store.dispatch('showStatus', { type: 'error', message: 'Error publising page!'});
            throw e;
          })
          .then((url) => store.dispatch('showStatus', { type: 'publish', message: 'Published Page!', action: `<a href="${url}">View</a>` }));
      },
      onScheduleClick() {
        // firefox uses a nonstandard AM/PM format, rather than the accepted W3C standard that other browsers use
        // therefore, check for AM/PM
        const date = this.dateValue,
          time = this.timeValue,
          datetime = _.includes(time, 'M') ? parseDate(date + ' ' + time, 'YYYY-MM-DD h:mm A') : parseDate(date + ' ' + time, 'YYYY-MM-DD HH:mm'),
          timestamp = getTime(datetime),
          store = this.$store;

        this.$store.dispatch('closePane');
        this.$store.commit(START_PROGRESS, 'schedule');
        this.$store.dispatch('schedulePage', { uri: this.$store.state.page.uri, timestamp }).then(() => {
          store.commit(FINISH_PROGRESS, 'schedule');
          store.dispatch('showStatus', { type: 'schedule', message: `Scheduled to publish ${calendar(datetime)}` });
        });
      }
    },
    mounted() {
      if (!hasNativePicker()) {
        // when instantiating, convert from the ISO format (what we save) to firefox's format (what the datepicker needs)
        initPicker(this.$refs.date);
        initPicker(this.$refs.time);
      }
    }
  };
</script>
