<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/inputs';
  @import '../styleguide/buttons';

  .add-page {
    padding: 17px;

    &-label {
      @include input-label();

      display: flex;
      flex-flow: column nowrap;
      margin-bottom: 20px;
    }

    &-input {
      @include input();

      flex: 1 1 auto;
      margin: 10px 0 0;
    }

    &-info {
      @include primary-text();
    }

    &-create {
      border-top: 1px solid $pane-border;
      bottom: 0;
      left: 0;
      padding: 15px;
      position: absolute;
      width: 100%;

      &-button {
        @include button-outlined($published);

        height: auto;
        font-size: 16px;
        margin: 0;
        padding: 15px 0;
        width: 100%;
      }
    }
  }
</style>

<template>
  <div class="add-page">
    <label class="add-page-label">
      Template Name
      <input class="add-page-input" v-model="title"></input>
    </label>

    <div class="add-page-info">The current page will be available as a template in the New Pages list, allowing other people to create pages based on it.</div>

    <div class="add-page-create">
      <button type="button" class="add-page-create-button" :disabled="title === ''" @click.stop="addPage">Add Page Template</button>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';

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

        store.dispatch('startProgress', 'save');
        return this.$store.dispatch('addToList', { list: 'new-pages', item: { id, title }})
          .then(() => store.dispatch('closePane'))
          .then(() => {
            store.dispatch('finishProgress', 'save');
            store.dispatch('showStatus', { type: 'save', message: `Added ${title} to Page Templates!` });
          }).catch((e) => {
            console.error(e);
            store.dispatch('finishProgress', 'error');
            store.dispatch('showStatus', { type: 'error', message: `Error adding ${title} to Page Templates: ${e.message}` });
          });
      }
    }
  };
</script>
