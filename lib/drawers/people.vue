<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .people-title {
    @include type-title();

    border-bottom: 1px solid $divider-color;
    padding: 16px;
    margin: 0;
  }

  .people-list {
    margin: 0;
    padding: 0;
    list-style: none;

    .person {
      align-items: flex-start;
      display: flex;
    }
  }
</style>

<template>
  <div class="people-drawer">
    <h2 class="people-title">Contributors</h2>
    <ul class="people-list">
      <li v-for="person in people" class="person">
        <img v-if="person.imageUrl" class="person-image" :src="person.imageUrl" />
        <span class="person-name">{{ person.name }}</span>
        <span class="person-timestamp">{{ person.formattedTime }}</span>
      </li>
    </ul>
    <div class="person-add">
      <button type="button" class="person-add-button" @click.stop="addPersonToPage">Add Person To Page</button>
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
      people() {
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
    methods: {
      addPersonToPage() {
        const offset = _.get(this.$store, 'state.ui.currentPane.offset');

        return this.$store.dispatch('openPane', {
          title: 'Add Person To Page',
          offset,
          content: {
            component: 'add-person-to-page'
          }
        })
      }
    }
  };
</script>
