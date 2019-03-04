<style lang="sass">
  @import '../../styleguide/layers';

  .simple-modal.ui-modal__mask {
    @include confirm-layer();

    position: fixed;

    .ui-modal__container,
    .ui-modal__body {
      // allow dropdowns and such to overflow modals
      overflow: visible;
    }
  }
</style>

<template>
  <ui-modal class="simple-modal" ref="modal" :title="title" :size="size" @open="onOpen" @close="onClose">
    <component :is="type" :data="data" @close="onChildClose"></component>
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
  import typeConfirmModal from './type-confirm-modal.vue';
  import typeReasonModal from './type-reason-modal.vue';
  import typeRestorePublishedVersionModal from './type-restore-published-version-modal.vue';
  import addBookmarkModal from './add-bookmark.vue';

  const noscrollClass = 'noscroll',
    htmlElement = document.documentElement;

  /**
   * Toggle the `noscroll` class
   * @param  {Boolean} show
   */
  function toggleNoScroll(show) {
    if (show) {
      htmlElement.classList.add(noscrollClass);
    } else if (!show && htmlElement.classList.contains(noscrollClass)) {
      htmlElement.classList.remove(noscrollClass);
    }
  }

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
    methods: {
      onChildClose() {
        this.$store.dispatch('closeModal');
      },
      onOpen() {
        toggleNoScroll(true);
      },
      onClose() {
        toggleNoScroll(false);
      }
    },
    components: _.merge(_.get(window, 'kiln.modals', {}), {
      UiModal,
      info: infoModal,
      keyboard: keyboardModal,
      'add-contributor': addContributorModal,
      'add-page': addPageModal,
      'add-user': addUserModal,
      'type-confirm': typeConfirmModal,
      'type-reason': typeReasonModal,
      'add-bookmark': addBookmarkModal,
      typeRestorePublishedVersionModal
    })
  };
</script>
