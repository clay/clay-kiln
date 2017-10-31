<style lang="sass">
  @import '../../styleguide/layers';

  .simple-modal.ui-modal__mask {
    @include confirm-layer();

    position: fixed;
  }
</style>

<template>
  <ui-modal class="simple-modal" ref="modal" :title="title" :size="size">
    <component :is="type" :data="data"></component>
  </ui-modal>
</template>

<script>
  import _ from 'lodash';
  import UiModal from 'keen/UiModal';
  import infoModal from './info-modal.vue';
  import keyboardModal from './keyboard-modal.vue';
  import addContributorModal from './add-contributor-modal.vue';
  import addPageModal from './add-page-modal.vue';
  import addUserModal from './add-user-modal.vue';

  export default {
    data() {
      return {};
    },
    computed: {
      modal() {
        return _.get(this.$store, 'state.ui.currentModal');
      },
      title() {
        return this.modal && this.modal.title;
      },
      size() {
        return this.modal && this.modal.size || 'normal';
      },
      type() {
        return this.modal && this.modal.type;
      },
      data() {
        return this.modal && this.modal.data;
      }
    },
    watch: {
      modal(val) {
        if (val) {
          this.$refs.modal.open();
        } else {
          this.$refs.modal.close();
        }
      }
    },
    components: _.merge({
      UiModal,
      info: infoModal,
      keyboard: keyboardModal,
      'add-contributor': addContributorModal,
      'add-page': addPageModal,
      'add-user': addUserModal
    }, window.kiln.modals)
  };
</script>
