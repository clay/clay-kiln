<style lang="sass">
  .status-selector {
    align-items: center;
    display: flex;

    .status-selector-checkbox {
      margin-left: 16px;
    }

    &.is-vertical {
      align-items: flex-start;
      flex-direction: column;
      padding: 8px 16px;

      .status-selector-checkbox {
        margin-left: 0;
      }
    }
  }
</style>

<template>
  <div class="status-selector" :class="{ 'is-vertical': vertical }">
    <ui-checkbox class="status-selector-checkbox" label="Draft" :value="statuses.draft" @change="change('draft')"></ui-checkbox>
    <ui-checkbox class="status-selector-checkbox" label="Scheduled" :value="statuses.scheduled" @change="change('scheduled')"></ui-checkbox>
    <ui-checkbox class="status-selector-checkbox" label="Published" :value="statuses.published" @change="change('published')"></ui-checkbox>
  </div>
</template>

<script>
  import UiCheckbox from 'keen/UiCheckbox';

  export default {
    props: ['statuses', 'vertical'],
    methods: {
      change(status) {
        this.$emit('select', status, !this.statuses[status]);
      }
    },
    components: {
      UiCheckbox
    }
  };
</script>
