<template>
  <button class="kiln-toolbar-button" @click.stop="handleClick">
    <div class="button-flex-inner">
      <icon :name="iconName"></icon>
      <span class="text" v-if="text" v-html="text"></span>
    </div>
  </button>
</template>

<script>
  import icon from '../utils/icon.vue';

  export default {
    props: ['iconName', 'name', 'text'],
    data() {
      return {};
    },
    methods: {
      handleClick() {
        this.$emit('click', this.name || this.iconName, this.$el);
      }
    },
    components: {
      icon
    }
  };
</script>
