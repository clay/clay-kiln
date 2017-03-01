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
  import moment from 'moment';
  import { hasNativePicker, init as initPicker } from '../../lib/utils/datepicker';

  const defaultDateFormat = 'YYYY-MM-DDThh:mm';

  export default {
    props: [],
    data() {
      return {
        dateValue: '',
        timeValue: ''
      }
    },
    computed: {
      showSchedule() {
        return this.dateValue && this.timeValue;
      }
    },
    methods: {
      onPublishClick() {
        console.log('Publish stuff');
      },
      onScheduleClick() {
        console.log(`Schedule post for ${this.dateValue} at ${this.timeValue}`);
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
