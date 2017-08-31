<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/buttons';

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
      padding: 12px 17px;
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
    }

    .person-image {
      flex: 0 0 32px;
      height: 32px;
      margin-right: 15px;
      width: 32px;
    }

    .person-name {
      color: $subtitle;
      flex: 1 0 auto;
      padding-right: 0 15px;
      // no left padding (it's handled by the image),
      // so name displays to the left if image doesn't exist
    }

    .person-timestamp {
      color: $page-list-text;
      display: block;
      flex: 0 0 auto;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .person-add {
      border-top: 1px solid $pane-border;
      bottom: 0;
      left: 0;
      padding: 15px;
      position: absolute;
      width: 100%;

      &-button {
        @include button-outlined($published);

        height: auto;
        font-size: 16px;
        margin: 0;
        padding: 15px 0;
        width: 100%;
      }
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
    <div class="person-add">
      <button type="button" class="person-add-button" @click.stop="addPersonToPage">Add Person To Page</button>
    </div>
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
