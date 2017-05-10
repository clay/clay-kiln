<style lang="sass">
  @import '../styleguide/colors';

  .people-pane {
    margin: 0;
    padding: 0;
    list-style: none;

    .person {
      align-items: center;
      border-bottom: 1px solid $pane-list-divider;
      display: flex;
      font-size: 14px;
      justify-content: space-between;
      padding: 10px 17px;
      position: relative;

      &:first-child {
        padding-top: 25px;

        .person-timestamp:before {
          color: $subtext;
          content: 'Last Edit';
          font-size: 12px;
          font-style: normal;
          font-weight: 500;
          position: absolute;
          right: 17px;
          text-transform: uppercase;
          top: 10px;
        }
      }

      &:last-child {
        padding-bottom: 20px;
      }
    }

    .person-image {
      flex: 0 0 32px;
      height: 32px;
      width: 32px;
    }

    .person-name {
      color: $subtitle;
      flex: 1 0 auto;
      padding: 0 15px;
    }

    .person-timestamp {
      color: $page-list-text;
      display: block;
      flex: 0 0 auto;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
  }
</style>

<template>
  <ul class="people-pane">
    <li v-for="person in people" class="person">
      <img v-if="person.imageUrl" class="person-image" :src="person.imageUrl" />
      <span class="person-name">{{ person.name }}</span>
      <span class="person-timestamp">{{ person.formattedTime }}</span>
    </li>
  </ul>
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
      return {}; // todo: fetch new list data when this pane opens
    },
    computed: {
      people() {
        const listData = _.get(this.$store, 'state.page.listData');

        return _.map(listData.users, (user) => {
          user.formattedTime = formatStatusTime(user.updateTime);
          return user;
        });
      }
    }
  };
</script>
