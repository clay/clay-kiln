<template>
  <div class="sort-selector" :class="{ 'is-vertical': vertical }">
    <ui-radio
      v-for="(sortItem) in sortingValues"
      :key="sortItem.trueValue"
      class="sort-selector-radio"
      color="accent"
      :label="sortItem.label"
      :value="selectedSort"
      :trueValue="sortItem.trueValue"
      @input="input"
    />
  </div>
</template>

<script>
  import UiRadio from 'keen/UiRadio';

  export default {
    props: ['selectedSort', 'vertical'],
    methods: {
      input(sortField) {
        this.$emit('select', sortField);
      }
    },
    components: {
      UiRadio
    },
    data() {
      return {
        sortingValues: [{
          label: 'Recently Updated',
          trueValue: 'updateTime'
        }, {
          label: 'Recently Published',
          trueValue: 'publishTime'
        }, {
          label: 'Recently Scheduled',
          trueValue: 'scheduledTime'
        }]
      };
    }
  };
</script>

<style lang="sass">
  .sort-selector {
    align-items: center;
    display: flex;

    .sort-selector-radio {
      margin-left: 16px;
    }

    &.is-vertical {
      align-items: flex-start;
      flex-direction: column;
      padding: 8px 16px;

      .sort-selector-radio {
        margin-left: 0;
      }

      .sort-selector-radio + .sort-selector-radio {
        margin-top: 8px;
      }
    }
  }
</style>
