<style lang="sass">
  .contributors-list {
    height: 100%;
  }
</style>

<template>
  <div class="contributors-list">
    <person
      v-for="contributor in contributors"
      :id="contributor.username"
      :image="contributor.imageUrl"
      :name="contributor.name"
      :subtitle="contributor.formattedTime"></person>
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

  export default {
    data() {
      return {};
    },
    asyncComputed: {
      contributors() {
        // refresh the page state (from the pages index), in case new users have edited this page
        // between the time it loaded and the time you opened the people pane
        return this.$store.dispatch('getListData', { uri: _.get(this.$store, 'state.page.uri') }).then(() => {
          // getListData sets the store, which we then pull from
          const state = _.cloneDeep(_.get(this.$store, 'state.page.state'));

          return _.map(state.users, (user) => {
            user.formattedTime = formatStatusTime(user.updateTime);
            return user;
          }).reverse();
        });
      }
    },
    components: {
      person
    }
  };
</script>
