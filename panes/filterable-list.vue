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
        <li v-for="item in matches">
          <button
            type="button"
            class="filterable-list-readout-list-item"
            @click.stop="onClick(item.id)">
            {{ item.title }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>


<script>
  import _ from 'lodash';

  function filterContent(content, query) {
    return _.filter(content, item => {
      return _.includes(item.title.toLowerCase(), query.toLowerCase());
    });
  }

  export default {
    props: ['content', 'onClick'],
    data() {
      return {
        query: ''
      }
    },
    computed: {
      matches() {
        return this.query.length ? filterContent(this.content, this.query): this.content;
      }
    },
    mounted() {
      this.$refs.search.focus();
    }
  };
</script>
