<style lang="sass">
  @import '../styleguide/_inputs';

  .filterable-list {
    padding: 17px;
    &-input {
      &-field {
        @include input();
      }
    }
    &-readout {
      overflow-y: scroll;
      overflow-x: hidden;
      max-height: 600px;

      &-list {
        list-style: none;
        margin: 0;
        padding: 0;

        > * + * {
          border-top: 1px solid $grey;
        }
      }
    }
  }

</style>

<template>
  <div class="filterable-list">
    <div class="filterable-list-input">
      <input
        type="text"
        class="filterable-list-input-field"
        placeholder="Begin typing to filter list"
        ref="search"
        v-model="query">
    </div>
    <div class="filterable-list-readout">
      <ul class="filterable-list-readout-list">
        <list-item v-for="item in matches" :item="item" :onClick="onClick" :onSettings="onSettings" :onDelete="onDelete"></list-item>
      </ul>
    </div>
  </div>
</template>


<script>
  import _ from 'lodash';
  import listItem from './filterable-list-item.vue';

  function filterContent(content, query) {
    return _.filter(content, item => {
      return _.includes(item.title.toLowerCase(), query.toLowerCase());
    });
  }

  export default {
    props: ['content', 'onClick', 'onSettings', 'onDelete'],
    data() {
      return {
        query: ''
      }
    },
    computed: {
      matches() {
        return this.query.length ? filterContent(this.content, this.query) : this.content;
      }
    },
    mounted() {
      this.$refs.search.focus();
    },
    components: {
      'list-item': listItem
    }
  };
</script>
