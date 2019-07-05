<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .publish-drawer {
    padding: 16px 0;
  }

  .publish-status {
    border-bottom: 1px solid $divider-color;
    display: flex;
    flex-direction: column;
    padding: 0 16px 16px;

    .status-message {
      @include type-subheading();
    }

    .status-time {
      @include type-caption();

      margin-top: 8px;
    }

    .status-undo-button {
      margin-top: 16px;
    }
  }

  .publish-actions {
    border-bottom: 1px solid $divider-color;
    display: flex;
    flex-direction: column;
    padding: 16px;

    .action-message {
      @include type-subheading();

      align-items: center;
      display: flex;
      height: 32px;
      justify-content: space-between;
      margin-top: -6px;
    }

    .schedule-form {
      align-items: flex-start;
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      width: 100%;

      .schedule-date,
      .schedule-time {
        margin: 0;
        width: 48%;
      }
    }

    .action-button {
      margin-top: 16px;
    }

    .action-error-message,
    .action-warning-message,
    .action-info-message {
      @include type-caption();

      cursor: pointer;
      margin-top: 16px;
    }

    .action-info-message {
      text-align: center;
    }

    .action-error-message {
      color: $md-red;
    }

    .action-warning-message {
      color: $md-orange;
    }
  }

  .publish-section {
    border-bottom: 1px solid $divider-color;
    margin-bottom: 0;
    padding: 0;

    .ui-collapsible__header {
      background-color: $pure-white;
    }

    .ui-collapsible__body {
      border: none;
    }
  }

  .publish-title {
    .publish-title-form {
      display: flex;
      flex-direction: column;
    }

    .title-description {
      @include type-body();
    }

    .title-input {
      margin-top: 8px;
    }

    .title-submit {
      margin-top: 16px;
    }
  }
</style>

<template>
  <div class="publish-drawer">
    <!-- publish status -->
    <div class="publish-status">
      <span class="status-message">{{ statusMessage }}</span>
      <span class="status-time">{{ time }}</span>
      <ui-button v-if="isScheduled" class="status-undo-button" buttonType="button" color="red" @click.stop="unscheduleLayout">Unschedule</ui-button>
    </div>

    <!-- publish actions -->
    <div class="publish-actions">
      <span class="action-message">{{ actionMessage }} <ui-icon-button v-if="showSchedule" icon="close" buttonType="button" type="secondary" color="default" size="small" tooltip="Clear Date/Time" tooltipPosition="left middle" @click.stop="clearScheduleForm"></ui-icon-button></span>
      <form class="schedule-form" @submit.prevent="scheduleLayout">
        <ui-datepicker class="schedule-date" color="accent" v-model="dateValue" :minDate="today" :customFormatter="formatDate" label="Date" :disabled="hasErrors"></ui-datepicker>
        <timepicker ref="timepicker" class="schedule-time" :value="timeValue" label="Time" :disabled="hasErrors" @update="updateTime"></timepicker>
      </form>
      <span class="action-info-message">Time Zone: {{ timezone }}</span>
      <ui-button v-if="showSchedule" :disabled="disableSchedule || hasErrors" class="action-button" buttonType="button" color="orange" @click.stop="scheduleLayout">{{ actionMessage }}</ui-button>
      <ui-button v-else :disabled="hasErrors" class="action-button" buttonType="button" color="accent" @click.stop="publishLayout">{{ actionMessage }}</ui-button>
      <span v-if="hasErrors" class="action-error-message" @click="goToHealth">Please fix errors before publishing</span>
      <span v-else-if="hasWarnings" class="action-warning-message" @click="goToHealth">Please review warnings before publishing</span>
    </div>

    <!-- manual title updating -->
    <ui-collapsible class="publish-section publish-title" title="Layout Title">
      <form class="publish-title-form" @submit.prevent="saveTitle">
        <span class="title-description">Update the name of this layout.</span>
        <ui-textbox class="title-input" v-model="title" label="Layout Title" :placeholder="defaultTitle"></ui-textbox>
        <ui-button class="title-submit" buttonType="submit" type="primary" color="default">Save</ui-button>
      </form>
    </ui-collapsible>
  </div>
</template>


<script>
  import _ from 'lodash';
  import dateFormat from 'date-fns/format';
  import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
  import parseDate from 'date-fns/parse';
  import getTime from 'date-fns/get_time';
  import { mapState } from 'vuex';
  import { getLayoutNameAndInstance } from '../utils/references';
  import { START_PROGRESS, FINISH_PROGRESS } from '../toolbar/mutationTypes';
  import { getTimezone, calendar, isInThePast } from '../utils/calendar';
  import UiIcon from 'keen/UiIcon';
  import UiButton from 'keen/UiButton';
  import UiDatepicker from 'keen/UiDatepicker';
  import UiTextbox from 'keen/UiTextbox';
  import UiCollapsible from 'keen/UiCollapsible';
  import UiIconButton from 'keen/UiIconButton';
  import timepicker from '../utils/timepicker.vue';
  import logger from '../utils/log';

  const log = logger(__filename);

  export default {
    data() {
      return {
        dateValue: null,
        timeValue: '',
        today: new Date(),
        title: ''
      };
    },
    computed: mapState({
      hasErrors: state => state.validation.errors && state.validation.errors.length > 0,
      hasWarnings: state => state.validation.warnings && state.validation.warnings.length > 0,
      isPublished: state => state.layout.state.published,
      isScheduled: state => state.layout.state.scheduled,
      uri: state => state.layout.uri,
      publishedDate: state => state.layout.state.publishTime,
      createdDate: state => state.layout.state.createTime,
      scheduledDate: state => state.layout.state.scheduledTime,
      lastUpdated: state => state.layout.state.updateTime,
      defaultTitle() {
        const { name, instance } = getLayoutNameAndInstance(this.$store);

        // set default title based on layout name + instance
        return `${instance} (${name})`;
      },
      statusMessage() {
        if (this.isScheduled) {
          return `Scheduled ${distanceInWordsToNow(this.scheduledDate, { addSuffix: true })}`;
        } if (this.isPublished) {
          return `Published ${distanceInWordsToNow(this.publishedDate, { addSuffix: true })}`;
        } else if (this.createdDate) {
          return `Draft Created ${distanceInWordsToNow(this.createdDate, { addSuffix: true })}`;
        } else {
          return 'Draft Created some time ago';
        }
      },
      time() {
        const tz = getTimezone();

        if (this.isScheduled) {
          return `${dateFormat(this.scheduledDate, 'MMMM Do [at] h:mm A')} (${tz} time)`;
        } else if (this.isPublished) {
          return `${dateFormat(this.publishedDate, 'MMMM Do [at] h:mm A')} (${tz} time)`;
        } else if (this.createdDate) {
          return `${dateFormat(this.createdDate, 'MMMM Do [at] h:mm A')} (${tz} time)`;
        } else {
          return 'Some time ago';
        }
      },
      showSchedule() {
        return this.dateValue || this.timeValue;
      },
      disableSchedule() {
        if (this.dateValue && !this.timeValue || this.timeValue && !this.dateValue) {
          // only one field is filled out (note: button is entirely hidden if neither field is filled out)
          return true;
        } else if (isInThePast(this.dateValue, this.timeValue)) {
          // scheduling things for the past makes them publish immediately
          // note: the date input has no UI to schedule things in the past, but the time input allows it
          return true;
        } else {
          // nothing preventing you from scheduling!
          return false;
        }
      },
      actionMessage() {
        if (this.isScheduled && this.showSchedule) {
          return 'Reschedule';
        } else if (this.showSchedule) {
          return 'Schedule';
        } else if (this.isPublished) {
          return 'Republish Now';
        } else {
          return 'Publish Now';
        }
      },
      timezone() {
        return getTimezone();
      }
    }),
    methods: {
      goToHealth() {
        this.$emit('selectTab', 'Health');
      },
      unscheduleLayout() {
        const store = this.$store;

        store.commit(START_PROGRESS);
        store.dispatch('unscheduleLayout')
          .catch((e) => {
            store.commit(FINISH_PROGRESS, 'error');
            log.error(`Error unscheduling layout: ${e.message}`, { action: 'unscheduleLayout' });
            store.dispatch('showSnackbar', {
              message: 'Error unscheduling layout',
              action: 'Retry',
              onActionClick: () => this.unscheduleLayout()
            });
            throw e;
          })
          .then(() => {
            store.commit(FINISH_PROGRESS);
            store.dispatch('showSnackbar', 'Unscheduled Layout');
          });
      },
      scheduleLayout() {
        const date = dateFormat(this.dateValue, 'YYYY-MM-DD'),
          time = this.timeValue,
          datetime = parseDate(date + ' ' + time),
          timestamp = getTime(datetime),
          store = this.$store;

        this.$store.commit(START_PROGRESS);
        this.$store.dispatch('scheduleLayout', { timestamp })
          .catch((e) => {
            log.error(`Error scheduling page: ${e.message}`, { action: 'scheduleLayout' });
            this.$store.dispatch('showSnackbar', {
              message: 'Error scheduling layout',
              action: 'Retry',
              onActionClick: () => this.scheduleLayout()
            });
            throw e;
          })
          .then(() => {
            store.commit(FINISH_PROGRESS);
            // reset date and time values
            this.clearScheduleForm();
            store.dispatch('showSnackbar', {
              message: `Scheduled to publish ${calendar(datetime)}`,
              action: 'Undo',
              onActionClick: () => this.unscheduleLayout()
            });
          });
      },
      publishLayout() {
        this.$store.dispatch('publishLayout')
          .catch((e) => {
            log.error(`Error publishing layout: ${e.message}`, { action: 'publishLayout' });
            this.$store.dispatch('showSnackbar', {
              message: 'Error publishing layout',
              action: 'Retry',
              onActionClick: () => this.publishLayout()
            });
            throw e;
          })
          .then(() => this.$store.dispatch('showSnackbar', 'Published Layout'));
      },
      formatDate(date) {
        return dateFormat(date, 'M/D/YY');
      },
      clearScheduleForm() {
        this.dateValue = null;
        this.$refs.timepicker.clear();
      },
      saveTitle() {
        const store = this.$store,
          val = this.title.trim();

        return store.dispatch('updateLayout', { title: val }).then(() => {
          store.dispatch('showSnackbar', 'Updated layout title');
        });
      },
      updateTime(val) {
        this.timeValue = val;
      }
    },
    mounted() {
      const currentTitle = _.get(this.$store, 'state.layout.state.title');

      // if the page already has a title set, default the form to use it
      if (currentTitle) {
        this.title = currentTitle;
      }
    },
    components: {
      UiIcon,
      UiButton,
      UiDatepicker,
      UiTextbox,
      UiCollapsible,
      UiIconButton,
      timepicker
    }
  };
</script>
