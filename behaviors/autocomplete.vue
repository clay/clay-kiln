<docs>
  # text

  Autocomplete
</docs>

<style lang="sass">
  @import '../styleguide/colors';

  .autocomplete {
    background-color: #FFFFFF;
    border: 1px solid $save;
    list-style: none;
    margin: 0;
    padding: 0;
    position: absolute;
    width: 100%;
  }
</style>

<template>
  <ol class="autocomplete" v-if="showMatches">
    <li v-for="(match, index) in matches">
      <item
        :index="index"
        :focusIndex="activeIndex"
        :value="match"
        :select="selectItem"></item>
    </li>
  </ol>
</template>

<script>
  import _ from 'lodash';
  import item from './autocomplete-item.vue';
  export default {
    props: ['args', 'query', 'select', 'focusIndex', 'updateFocusIndex', 'updateMatches'],
    data() {
      return {
        localIndex: null,
        prevFocusIndex: null,
      };
    },
    computed: {
      listItems() {
        const lists = this.$store.state.lists,
          listName = this.args.list;

        // if the list isn't in the store yet, tell Vuex to get it
        if (listName && !lists[listName]) {
          this.$store.dispatch('getList', listName);
          return [];
        }
        return lists[listName].items;
      },
      showMatches() {
        return this.query.length >= 2 && this.matches.length;
      },
      matches() {
        var matches = _.take(_.filter(this.listItems, option => {
          return _.includes(option.toLowerCase(), this.query.toLowerCase());
        }), 20);

        this.updateMatches(matches);

        return matches;
      },
      activeIndex() {
        var activeIndex,
          matchesLength = this.matches.length;

        if (_.isNumber(this.focusIndex)) {
          if (this.focusIndex < 0) {
            activeIndex = matchesLength - 1;
          } else {
            activeIndex = this.focusIndex % matchesLength;
          }
        } else if (this.prevFocusIndex && !this.focusIndex) {
          this.matches = [];
        }

        // Update parent with new focus value
        this.updateFocusIndex(activeIndex);
        // Cache the previous to know the direction
        this.prevFocusIndex = this.focusIndex;
        // Return the active index
        return activeIndex;
      }
    },
    methods: {
      selectItem(value) {
        this.select(value);
      }
    },
    components: {
      item
    },
  };
</script>
