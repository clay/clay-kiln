<docs>
  # autocomplete

  Autocomplete for `simple-list`.
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
        listItems: []
      };
    },
    computed: {
      showMatches() {
        return this.query.length >= 2 && this.matches.length;
      },
      matches() {
        const query = this.query || '';

        let matches = _.take(_.filter(this.listItems, (option) => {
          return _.includes(option.toLowerCase(), query.toLowerCase());
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
    mounted() {
      const listName = this.args.list,
        lists = this.$store.state.lists;

      return this.$store.dispatch('getList', listName).then(() => {
        this.listItems = _.map(_.get(lists, `${listName}.items`), (item) => _.isObject(item) ? item.text : item);
      });
    },
    components: {
      item
    },
  };
</script>
