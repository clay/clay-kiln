<style lang="sass">
  @import '../../styleguide/typography';

  .add-page-modal {
    .add-page-button {
      margin-top: 16px;
    }
  }
</style>

<template>
  <form class="add-page-modal" @submit.prevent="addPage">
    <ui-textbox class="add-page-input" v-model="title" :required="true" :autofocus="true" :floatingLabel="true" label="Template Name" help="The current page will be available as a template in the New Pages list, allowing other people to create pages based on it"></ui-textbox>
    <ui-button class="add-page-button" color="primary" :disabled="title === ''">Add Page Template</ui-button>
  </form>
</template>

<script>
  import _ from 'lodash';
  import UiTextbox from 'keen/UiTextbox';
  import UiButton from 'keen/UiButton';
  import logger from '../utils/log';

  const log = logger(__filename);

  export default {
    data() {
      return {
        title: ''
      };
    },
    methods: {
      addPage() {
        const title = this.title,
          uri = _.get(this.$store, 'state.page.uri'),
          id = uri.match(/pages\/([A-Za-z0-9\-]+)/)[1];

        return this.$store.dispatch('updateList', { listName: 'new-pages', fn: (items) => items.concat([{ id, title }])})
          .then(() => this.$store.dispatch('closePane'))
          .then(() => {
            this.$store.dispatch('closeModal');
            this.$store.dispatch('showSnackbar', `Added ${title} to Page Templates`);
          }).catch((e) => {
            log.error(`Error adding ${title} to Page Templates: ${e.message}`, { action: 'addPage', uri });
            this.$store.dispatch('closeModal');
            this.$store.dispatch('showSnackbar', `Error adding ${title} to Page Templates`);
          });
      }
    },
    components: {
      UiTextbox,
      UiButton
    }
  };
</script>
