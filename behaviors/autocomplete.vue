<docs>
  # text

  Autocomplete
</docs>

<style lang="sass">

  .autocomplete {
    background-color: #FFF;
    border: 1px solid blue;
    list-style: none;
    margin: 0;
    padding: 0;
    position: absolute;
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
  import { getJSON } from '../lib/core-data/api';
  import { uriToUrl } from '../lib/utils/urls';

  const textProp = 'text';

  function flattenText(items) {
    var pluckedText = _.compact(_.map(items, textProp)),
      hasTextProp = _.isString(_.head(pluckedText));

    return hasTextProp ? pluckedText : items;
  }

  export default {
    props: ['args', 'query', 'select', 'focusIndex', 'updateFocusIndex', 'updateMatches'],
    data() {
      return {
        localIndex: null,
        prevFocusIndex: null,
      }
    },
    asyncComputed: {
      options() {
        // Get the JSON response from the API passed in
        return getJSON(this.getApi())
          .then(flattenText);
      }
    },
    computed: {
      showMatches() {
        return this.query.length >= 2 && this.matches.length;
      },
      matches() {
        var matches = _.take(_.filter(this.options, option => {
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
        } else if (this.prevFocusIndex && !this.focusIndex){
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
      },
      getApi() {
        if (this.args.api) {
          return this.args.api;
        } else if (this.args.list) {
          return uriToUrl(this.$store.state.site.prefix) + '/lists/' + this.args.list;
        } else {
          return null;
        }
      }
    },
    components: {
      item
    },
  };
</script>
