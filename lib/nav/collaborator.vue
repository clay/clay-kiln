<style lang="sass">
  .collaborator {
    position: relative;
  }

  .collaborator + .collaborator {
    margin-left: 8px;
  }
</style>

<template>
  <div class="collaborator" @click.stop="selectCollaborator">
    <avatar class="collaborator-image" :url="user.imageUrl" size="small" :name="user.name || user.username" ref="avatar"></avatar>
    <ui-tooltip trigger="avatar" position="bottom left">{{ user.name || user.username }}</ui-tooltip>
  </div>
</template>

<script>
  import UiTooltip from 'keen/UiTooltip';
  import avatar from '../utils/avatar.vue';

  export default {
    props: ['user'],
    methods: {
      selectCollaborator() {
        this.$emit('select', this.user.username);
      }
    },
    components: {
      UiTooltip,
      avatar
    }
  };
</script>
