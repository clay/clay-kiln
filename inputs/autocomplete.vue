<template>
  <ol class="autocomplete" v-if="showMatches && !disabled">
    <li v-for="(match, index) in matches">
      <item
        :index="index"
        :focusIndex="activeIndex"
        :value="match"
        :select="select"
        :allowRemove="args.allowRemove"
        :remove="removeFromList"
        ></item>
    </li>
  </ol>
</template>

<script>
  import _ from 'lodash';
  import item from './autocomplete-item.vue';
  import { getItemIndex, getProp } from '../lib/lists/helpers';
  import Fuse from 'fuse.js';

  export default {
    props: ['args', 'select', 'query', 'focusIndex', 'updateFocusIndex', 'updateMatches', 'unselect', 'disabled'],
    data() {
      return {
        localIndex: null,
        prevFocusIndex: null,
        listItems: [],
        additionalPixels: 0
      };
    },
    computed: {
      showMatches() {
        return this.query.length >= 2 && this.matches.length;
      },
      matches() {
        const query = this.query || '';
        let items;

        if (this.args.fuzzy) {
          // const matches = new Fuse(this.listItems, { threshold: 0.4 }).search(query);
          // const items = matches.map((el) => this.listItems[el]).slice(0, 15);
          const scoreMatches = new Fuse(this.listItems, {
            includeScore: true,
            threshold: 0.35
          }).search(query);

          const scores = scoreMatches
            .map((el, idx) => ({ item: this.listItems[el.item], score: el.score, idx }))
            .slice(0, 15);

          console.log(scores);

          items = scoreMatches
            .map((el) => (this.listItems[el.item]))
            .slice(0, 15);
        } else {
          items = _.take(_.filter(this.listItems, (option) => {
            return _.includes(option.toLowerCase(), query.toLowerCase());
          }), 20);
        }

        this.updateMatches(items);

        return items;
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
    watch: {
      matches(val) {
        let pixelLength = val ? val.length * 40 : 0;

        // only rachet up the size, never make the size smaller
        if (val && this.showMatches && pixelLength > this.additionalPixels) {
          this.additionalPixels = pixelLength;
          // when matches change, potentially resize the form
          this.$root.$emit('resize-form', pixelLength);
        }
      }
    },
    methods: {
      fetchListItems() {
        const listName = this.args.list,
          lists = this.$store.state.lists,
          items = _.get(lists, `${listName}.items`);
        let promise;

        if (items) {
          promise = Promise.resolve(items);
        } else {
          promise = this.$store.dispatch('getList', listName).then(() => _.get(lists, `${listName}.items`));
        }

        return promise.then((listItems) => {
          this.listItems = _.map(listItems, item => _.isObject(item) ? item.text : item);
        });
      },
      removeFromList(item) {
        const listName = this.args.list;

        this.unselect();

        return this.$store.dispatch('patchList', {
          listName: listName,
          fn: (items) => {
            const stringProperty = getProp(items, 'text'),
              index = getItemIndex(items, item, stringProperty);

            if (index !== -1) {
              return { remove: [items[index]] };
            }
          }
        }).then(list => this.listItems = _.map(list, item => _.isObject(item) ? item.text : item));
      }
    },
    mounted() {
      this.fetchListItems();
    },
    components: {
      item
    }
  };
</script>

<style lang="sass">
  @import '../styleguide/colors';

  .autocomplete {
    background-color: $card-bg-color;
    box-shadow: 1px 2px 8px $md-grey-600;
    display: block;
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
    position: absolute;
    top: 100%;
    width: 100%;
    z-index: 1;
  }
</style>
